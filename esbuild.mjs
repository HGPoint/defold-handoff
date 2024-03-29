/* global console, process */

import fs from "node:fs";
import { build, context } from "esbuild";
import esbuildSvelte from "esbuild-svelte"; 
import sveltePreprocess from "svelte-preprocess";

const HTML_TEMPLATE = `<style>{{style}}</style><div id="root" class="root"></div><script>{{script}}</script>`

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

let inlineResources = {
  name: 'inline-resources',
  setup(build) {
    build.onEnd(() => {
      Promise.all([
        readFile('./dist/app.js'),
        readFile('./dist/app.css'),
      ])
        .then((data) => {
          const [script, styles] = data;
          const content = HTML_TEMPLATE
            .replace('{{script}}', script)
            .replace('{{style}}', styles);
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
  entryPoints: ["./src/plugin.ts"],
  target: "ES6",
  bundle: true,
  outfile: "./dist/plugin.js",
  logLevel: "info",
}

const uiConfig = {
  entryPoints: ["./src/app.ts"],
  mainFields: ["svelte", "browser", "module", "main"],
  conditions: ["svelte", "browser"],
  target: "ES6",
  bundle: true,
  outfile: "./dist/app.js",
  plugins: [
    esbuildSvelte({
      preprocess: sveltePreprocess(),
    }),
    inlineResources,
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
    const pluginBuildConfig = { ...figmaPluginConfig, minifyWhitespace: true };
    const uiBuildConfig = { ...uiConfig, minifyWhitespace: true };
    await build(pluginBuildConfig);
    await build(uiBuildConfig);
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
