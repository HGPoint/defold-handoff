/* global console, process */

import fs from "node:fs";
import { build, context } from "esbuild";
import esbuildSvelte from "esbuild-svelte"; 
import sveltePreprocess from "svelte-preprocess";

const HTML_TEMPLATE = `<main id="root" class="root"></main><script>{{script}}</script>`

function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

function writeFile(filePath, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

let inlineScript = {
  name: 'inline-script',
  setup(build) {
    build.onEnd(() => {
      readFile('./dist/app.js')
        .then((data) => {
          const content = HTML_TEMPLATE.replace('{{script}}', data);
          writeFile('./dist/ui.html', content);
        })
        .catch((err) => {
          console.error(err);
          process.exit(1);
        });
    });
  },
}

const figmaPluginConfig = {
  entryPoints: ["./src/code.ts"],
  target: "ES6",
  bundle: true,
  outfile: "./dist/code.js",
  logLevel: "info",
}

const uiConfig = {
  entryPoints: ["./src/ui/app.ts"],
  mainFields: ["svelte", "browser", "module", "main"],
  conditions: ["svelte", "browser"],
  target: "ES6",
  bundle: true,
  outdir: "./dist",
  plugins: [
    esbuildSvelte({
      preprocess: sveltePreprocess(),
    }),
    inlineScript,
  ],
  logLevel: "info",
}

async function watchProjects() {
  try {
    const pluginContext = await context({
      ...figmaPluginConfig,
    });
    const uiContext = await context({
      ...uiConfig,
    });
    await pluginContext.watch();
    await uiContext.watch()
  } catch (error) {
    console.error("Watch failed:", error);
    process.exit(1);
  }
}

async function buildProjects() {
  try {
    await build(figmaPluginConfig);
    await build(uiConfig);
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
if (args.includes("--watch")) {
  watchProjects();
} else {
  buildProjects();
}
