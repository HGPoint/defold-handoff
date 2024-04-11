declare global {
  const defoldHandoffUIMode: UIMode;
}

import App from "components/App/App.svelte"

const target = document.getElementById("root");
const app = target ? new App({ target, props: { mode: defoldHandoffUIMode } }) : null;

export default app
