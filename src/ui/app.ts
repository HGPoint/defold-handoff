import App from "./components/App/App.svelte"

const target = document.getElementById("root");
let app;
if (target) {
  app = new App({ target });
}

export default app