#!/usr/bin/env node

/* global console, process, Buffer, setTimeout, clearTimeout */

import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import { WebSocketServer } from "ws";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const WS_PORT = 3055;
const REQUEST_TIMEOUT = 15000;
const EXPORT_TIMEOUT = 120000;

const EXPORT_ACTIONS = {
  gui: "exportGUI",
  gui_atlases: "exportGUIAtlases",
  atlases: "exportAtlases",
  bundle: "exportBundle",
  bare_bundle: "exportBareBundle",
};

const pending = new Map();

let plugin = null;

function log(...args) {
  console.error("[agent]", ...args);
}

function onPluginMessage(message) {
  const request = pending.get(message.requestId);
  if (!request) {
    pending.forEach(({ messages }) => messages.push(message));
    return;
  }
  pending.delete(message.requestId);
  clearTimeout(request.timer);
  if (message.type === "failed") {
    request.reject(new Error(message.data?.error ?? "Unknown plugin error"));
    return;
  }
  request.resolve({ data: message.data, messages: request.messages });
}

function onPluginConnected(socket) {
  plugin = socket;
  log("plugin connected");
  socket.on("message", (raw) => onPluginMessage(JSON.parse(raw.toString())));
  socket.on("close", () => {
    if (plugin === socket) {
      plugin = null;
    }
    log("plugin disconnected");
  });
}

function onRequestTimedOut(requestId, type) {
  const { reject } = pending.get(requestId);
  pending.delete(requestId);
  reject(new Error(`Timed out waiting for ${type}`));
}

function request(type, data, timeout = REQUEST_TIMEOUT) {
  if (!plugin) {
    throw new Error("Figma plugin is not connected. Open Defold Handoff > Agent Mode in Figma.");
  }
  const requestId = randomUUID();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => onRequestTimedOut(requestId, type), timeout);
    pending.set(requestId, { messages: [], resolve, reject, timer });
    plugin.send(JSON.stringify({ type, data, requestId }));
  });
}

async function requestData(type, payload) {
  const { data } = await request(type, { [type]: payload });
  return data;
}

function trimSelection(selection) {
  if (!selection) {
    return selection;
  }
  const layers = (selection.layers ?? []).map(({ id, name, type }) => ({ id, name, type }));
  return { ...selection, layers };
}

function trimMessage(message) {
  if (message.type !== "selectionChanged") {
    return message;
  }
  return { ...message, data: { selection: trimSelection(message.data?.selection) } };
}

function findArchive(messages) {
  const exported = messages.find((message) => message.data?.archive);
  if (!exported) {
    const failed = messages.find((message) => message.type === "failed");
    throw new Error(failed?.data?.error ?? "Nothing was exported");
  }
  return exported.data.archive;
}

async function unpackArchive(base64, outDir) {
  const zip = await JSZip.loadAsync(Buffer.from(base64, "base64"));
  const written = [];
  for (const [relativePath, entry] of Object.entries(zip.files)) {
    if (entry.dir) {
      continue;
    }
    const target = path.join(outDir, relativePath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, await entry.async("nodebuffer"));
    written.push(target);
  }
  return written;
}

function text(value) {
  const payload = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return { content: [{ type: "text", text: payload }] };
}

function registerTools(server) {
  server.tool(
    "figma_status",
    "Check whether the Defold Handoff plugin is connected in Agent Mode",
    {},
    async () => text({ connected: !!plugin }),
  );

  server.tool(
    "figma_document",
    "Read the document name, its pages and the current page",
    {},
    async () => text(await requestData("agentDocument")),
  );

  server.tool(
    "figma_find",
    "Find Figma layers by name substring inside root_id (page or layer). Without root_id searches the current page",
    { query: z.string().min(1), root_id: z.string().optional() },
    async ({ query, root_id }) => text(await requestData("agentFind", { query, rootId: root_id })),
  );

  server.tool(
    "figma_inspect",
    "Read node tree (geometry + Defold GUI node data) of pages or layers. Without ids inspects current selection",
    { ids: z.array(z.string()).optional(), depth: z.number().int().min(0).max(10).optional() },
    async ({ ids, depth }) => text(await requestData("agentInspect", { ids, depth })),
  );

  server.tool(
    "figma_select",
    "Select layers in Figma, switching to their page. Handoff actions and exports act on this selection",
    { ids: z.array(z.string()).min(1) },
    async ({ ids }) => text(await requestData("agentSelect", { ids })),
  );

  server.tool(
    "figma_screenshot",
    "Render a Figma page or layer to a PNG image",
    { id: z.string(), scale: z.number().min(0.1).max(4).optional() },
    async ({ id, scale }) => {
      const { image } = await requestData("agentCapture", { id, scale });
      return { content: [{ type: "image", data: image, mimeType: "image/png" }] };
    },
  );

  server.tool(
    "figma_run",
    "Run JavaScript inside the plugin as an async function body with the Figma Plugin API available as `figma`. Use it to create, modify or remove layers. Return a JSON-serializable value, never a node",
    { code: z.string().min(1) },
    async ({ code }) => text(await requestData("agentRun", { code })),
  );

  server.tool(
    "figma_send",
    "Send any Defold Handoff plugin message (e.g. updateGUINode, updateGUI, updateProject, fixGUI, updateAtlas, updateSection). Acts on current selection. Resolves when the plugin has processed the message and returns the messages it emitted meanwhile. Use figma_inspect to read the resulting data",
    { type: z.string(), data: z.record(z.unknown()).optional() },
    async ({ type, data }) => {
      const { messages } = await request(type, data);
      return text(messages.map(trimMessage));
    },
  );

  server.tool(
    "figma_export",
    "Export current selection through Defold Handoff and unpack the result into out_dir",
    { kind: z.enum(Object.keys(EXPORT_ACTIONS)), out_dir: z.string() },
    async ({ kind, out_dir }) => {
      const { messages } = await request(EXPORT_ACTIONS[kind], undefined, EXPORT_TIMEOUT);
      const archive = findArchive(messages);
      const files = await unpackArchive(archive, path.resolve(out_dir));
      return text({ files });
    },
  );
}

async function main() {
  const wss = new WebSocketServer({ port: WS_PORT });
  wss.on("connection", onPluginConnected);
  log(`listening on ws://localhost:${WS_PORT}`);

  const server = new McpServer({ name: "defold-handoff-agent", version: "0.1.0" });
  registerTools(server);
  await server.connect(new StdioServerTransport());
  process.stdin.on("close", () => process.exit(0));
}

main().catch((error) => {
  log(error);
  process.exit(1);
});
