<script lang="ts">
  import agentState from "state/agent";
  import { AGENT_SERVER_URL, serializeAgentMessage } from "utilities/agent";
  import { isPluginMessage, resolvePluginVersion } from "utilities/ui";

  const RECONNECT_DELAY = 2000;
  const IDLE_DELAY = 600;

  let socket: WithNull<WebSocket> = null;
  let forwarding: Promise<void> = Promise.resolve();
  let idleTimer: ReturnType<typeof setTimeout>;

  function connect() {
    socket = new WebSocket(AGENT_SERVER_URL);
    socket.onopen = onServerConnected;
    socket.onmessage = onServerMessage;
    socket.onclose = onServerDisconnected;
  }

  function isConnected() {
    return socket?.readyState === WebSocket.OPEN;
  }

  function resetState() {
    const status = isConnected() ? "connected" : "waiting";
    $agentState = { status, action: null };
  }

  function sendToServer(message: string) {
    if (isConnected()) {
      socket?.send(message);
    }
  }

  function onServerConnected() {
    const message = JSON.stringify({ type: "connected", data: { version: resolvePluginVersion() } });
    sendToServer(message);
    resetState();
  }

  function onServerDisconnected() {
    resetState();
    setTimeout(connect, RECONNECT_DELAY);
  }

  function onServerMessage(event: MessageEvent<string>) {
    const pluginMessage: PluginMessage = JSON.parse(event.data);
    clearTimeout(idleTimer);
    $agentState = { status: "working", action: pluginMessage.type };
    parent.postMessage({ pluginMessage }, "*");
  }

  async function forwardResponse(pluginMessage: PluginMessage) {
    const message = await serializeAgentMessage(pluginMessage);
    sendToServer(message);
    idleTimer = setTimeout(resetState, IDLE_DELAY);
  }

  function onForwardFailed(error: Error, requestId?: string) {
    const message = JSON.stringify({ type: "failed", data: { error: error.message }, requestId });
    sendToServer(message);
  }

  function onMessage(event: MessageEvent) {
    if (isPluginMessage(event) && event.data.pluginMessage.requestId) {
      const { pluginMessage } = event.data;
      forwarding = forwarding
        .then(() => forwardResponse(pluginMessage))
        .catch((error: Error) => onForwardFailed(error, pluginMessage.requestId));
    }
  }

  connect();
</script>

<svelte:window on:message={onMessage} />
