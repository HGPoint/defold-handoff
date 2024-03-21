import App from "./components/App/App.svelte"

const target = document.getElementById("root");
console.log(target);
const app = target ? new App({ target }) : null;

export default app