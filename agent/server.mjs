#!/usr/bin/env node

/* global console, process, Buffer, setTimeout, clearTimeout, URL */

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import { WebSocketServer } from "ws";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const WS_HOST = "127.0.0.1";
const WS_PORT = 3055;
const REQUEST_TIMEOUT = 15000;
const RUN_TIMEOUT = 60000;
const EXPORT_TIMEOUT = 300000;
const PROJECT_FILE = "handoff.json";
const BUILD_CODE = "const { id, name } = await L.build(ARGS.spec, await figma.getNodeByIdAsync(ARGS.parentId)); return { id, name };";
const IMPORT_SPRITES_CODE = "return L.importSprites(ARGS.atlas, ARGS.group, ARGS.files);";
const UPDATE_SPRITE_CODE = "return L.updateSprite(ARGS.sprite, ARGS.image);";
const { version: VERSION } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

const pending = new Map();

let plugin = null;
let listenError = null;

function log(...args) {
  console.error("[agent]", ...args);
}

function onPluginMessage(socket, message) {
  if (message.type === "connected") {
    plugin = { socket, ...message.data };
    return;
  }
  const request = pending.get(message.requestId);
  if (!request) {
    return;
  }
  pending.delete(message.requestId);
  clearTimeout(request.timer);
  if (message.type === "failed") {
    request.reject(new Error(message.data?.error ?? "Unknown plugin error"));
    return;
  }
  request.resolve(message.data);
}

function onPluginConnected(socket) {
  plugin = { socket };
  log("plugin connected");
  socket.on("message", (raw) => onPluginMessage(socket, JSON.parse(raw.toString())));
  socket.on("close", () => {
    if (plugin?.socket === socket) {
      plugin = null;
    }
    log("plugin disconnected");
  });
}

function onListenFailed(error) {
  listenError = error.code === "EADDRINUSE" ? `Port ${WS_PORT} is taken: another agent session holds the plugin connection` : error.message;
  log(listenError);
}

function onRequestTimedOut(requestId, type) {
  const { reject } = pending.get(requestId);
  pending.delete(requestId);
  reject(new Error(`Timed out waiting for ${type}. It may have been applied: inspect before repeating`));
}

function requirePlugin() {
  if (listenError) {
    throw new Error(listenError);
  }
  if (!plugin) {
    throw new Error("Figma plugin is not connected. Open Defold Handoff > Agent Mode in Figma.");
  }
  if (plugin.version !== VERSION) {
    throw new Error(`Plugin is ${plugin.version ?? "unknown"}, the agent is ${VERSION}. Update both to the same release.`);
  }
  return plugin.socket;
}

function request(type, payload, timeout = REQUEST_TIMEOUT) {
  const socket = requirePlugin();
  const requestId = randomUUID();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => onRequestTimedOut(requestId, type), timeout);
    pending.set(requestId, { resolve, reject, timer });
    socket.send(JSON.stringify({ type, data: { [type]: payload }, requestId }));
  });
}

async function findProjectFile() {
  for (let directory = process.cwd(); ; directory = path.dirname(directory)) {
    const file = path.join(directory, PROJECT_FILE);
    if (await fs.access(file).then(() => true, () => false)) {
      return file;
    }
    if (directory === path.dirname(directory)) {
      return null;
    }
  }
}

async function readProject() {
  const file = await findProjectFile();
  if (!file) {
    throw new Error(`${PROJECT_FILE} not found in ${process.cwd()} or above it`);
  }
  const project = JSON.parse(await fs.readFile(file, "utf8"));
  if (!project.page) {
    throw new Error(`${file}: no page`);
  }
  return project;
}

async function requestProject(type, payload, timeout = RUN_TIMEOUT) {
  const project = await readProject();
  return request(type, { ...payload, project }, timeout);
}

async function readCode(code, file) {
  if (code === undefined && file === undefined) {
    throw new Error("Pass code or file");
  }
  return code ?? fs.readFile(path.resolve(file), "utf8");
}

async function readBase64(file) {
  const bytes = await fs.readFile(path.resolve(file));
  return bytes.toString("base64");
}

async function readFiles(files) {
  const entries = Object.entries(files).map(async ([name, file]) => [name, await readBase64(file)]);
  return Object.fromEntries(await Promise.all(entries));
}

async function requireEmpty(directory) {
  const entries = await fs.readdir(directory).catch(() => []);
  if (entries.length) {
    throw new Error(`${directory} is not empty: export into a new directory`);
  }
}

async function unpackArchive(base64, outDir) {
  const zip = await JSZip.loadAsync(Buffer.from(base64, "base64"));
  const files = Object.entries(zip.files).filter(([, entry]) => !entry.dir);
  for (const [relativePath, entry] of files) {
    const target = path.join(outDir, relativePath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, await entry.async("nodebuffer"));
  }
  return files.length;
}

function text(value) {
  const payload = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return { content: [{ type: "text", text: payload }] };
}

async function run(code, args) {
  const { result } = await requestProject("agentRun", { code, args });
  return text(result ?? null);
}

function registerTools(server) {
  server.tool(
    "figma_status",
    "Check the connection to the Defold Handoff plugin (Agent Mode) and which handoff.json is in use",
    {},
    async () => text({ connected: !!plugin, plugin: plugin?.version ?? null, agent: VERSION, project: await findProjectFile(), error: listenError }),
  );

  server.tool(
    "figma_document",
    "Read the document name, its pages, the current page and the Handoff project settings (screen size, paths, fonts)",
    {},
    async () => text(await request("agentDocument")),
  );

  server.tool(
    "figma_find",
    "Find Figma layers by name substring inside root_id (page or layer). Without root_id searches the current page",
    { query: z.string().min(1), root_id: z.string().optional() },
    async ({ query, root_id }) => text((await request("agentFind", { query, rootId: root_id })).nodes),
  );

  server.tool(
    "figma_inspect",
    "Read the tree of layers: geometry, text styles, the atlas sprite or template behind an instance, the source size of a foreign image, non-default Defold GUI node data. Without ids inspects the current selection",
    { ids: z.array(z.string()).optional(), depth: z.number().int().min(0).max(10).optional() },
    async ({ ids, depth }) => text((await request("agentInspect", { ids, depth })).nodes),
  );

  server.tool(
    "figma_select",
    "Select layers in Figma, switching to their page",
    { ids: z.array(z.string()).min(1) },
    async ({ ids }) => text((await request("agentSelect", { ids })).nodes),
  );

  server.tool(
    "figma_screenshot",
    "Render a Figma page or layer to PNG. With path the image is saved to that file instead of being returned: use it to take a sprite out of a frame",
    { id: z.string(), scale: z.number().min(0.1).max(8).optional(), path: z.string().optional() },
    async ({ id, scale, path: file }) => {
      const { image } = await request("agentCapture", { id, scale });
      if (!file) {
        return { content: [{ type: "image", data: image, mimeType: "image/png" }] };
      }
      const target = path.resolve(file);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, Buffer.from(image, "base64"));
      return text({ path: target });
    },
  );

  server.tool(
    "figma_run",
    "Run JavaScript inside the plugin as an async function body: inline code or a script file. In scope: `figma` (Plugin API), `L` (Handoff library), `PROJECT` (handoff.json), `ARGS`. Return a JSON-serializable value, never a node",
    { code: z.string().optional(), file: z.string().optional(), args: z.record(z.unknown()).optional() },
    async ({ code, file, args }) => run(await readCode(code, file), args),
  );

  server.tool(
    "figma_build",
    "Build a GUI node with its children from a spec file (JSON) inside parent_id: a section for a root, a node for a child. Fails when the parent already has a child of that name",
    { spec_file: z.string(), parent_id: z.string() },
    async ({ spec_file, parent_id }) => {
      const spec = JSON.parse(await fs.readFile(path.resolve(spec_file), "utf8"));
      return run(BUILD_CODE, { spec, parentId: parent_id });
    },
  );

  server.tool(
    "figma_import_sprites",
    "Add PNG files as sprites to a group (component set) of an atlas, creating the group when it is new. files maps sprite names to PNG paths; existing names are skipped",
    { atlas: z.string(), group: z.string(), files: z.record(z.string()) },
    async ({ atlas, group, files }) => run(IMPORT_SPRITES_CODE, { atlas, group, files: await readFiles(files) }),
  );

  server.tool(
    "figma_update_sprite",
    "Replace the picture of a sprite (`<atlas>/<name>`) with a PNG file, keeping its instances in place. Returns the instances with their kind: slice9, auto, manual",
    { sprite: z.string(), path: z.string() },
    async ({ sprite, path: file }) => run(UPDATE_SPRITE_CODE, { sprite, image: await readBase64(file) }),
  );

  server.tool(
    "figma_export",
    "Export every GUI root and atlas of the page through Defold Handoff and unpack them into out_dir, which must be empty or missing",
    { out_dir: z.string() },
    async ({ out_dir }) => {
      const target = path.resolve(out_dir);
      await requireEmpty(target);
      const { archive } = await requestProject("agentExport", {}, EXPORT_TIMEOUT);
      return text({ out_dir: target, files: await unpackArchive(archive, target) });
    },
  );
}

async function main() {
  const wss = new WebSocketServer({ host: WS_HOST, port: WS_PORT });
  wss.on("connection", onPluginConnected);
  wss.on("error", onListenFailed);
  wss.on("listening", () => log(`listening on ws://${WS_HOST}:${WS_PORT}`));

  const server = new McpServer({ name: "defold-handoff-agent", version: VERSION });
  registerTools(server);
  await server.connect(new StdioServerTransport());
  process.stdin.on("close", () => process.exit(0));
}

main().catch((error) => {
  log(error);
  process.exit(1);
});
