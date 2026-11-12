/* global URL */

import { fileURLToPath } from "node:url";

const SERVER_NAME = "defold-handoff";
const SERVER_PATH = fileURLToPath(new URL("./server.mjs", import.meta.url));

export default function (pi) {
  pi.registerMcpServer(SERVER_NAME, { command: "node", args: [SERVER_PATH] });
}
