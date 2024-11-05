/**
 * The entry point for the UI application. It handles the editor UI and interactions with browser APIs.
 * @packageDocumentation
 */

declare global {
  const defoldHandoffUIMode: UIMode;
}

import App from "components/App/App.svelte";

const target = document.getElementById("root");
const app = target ? new App({ target, props: { mode: defoldHandoffUIMode } }) : null;

export default app
