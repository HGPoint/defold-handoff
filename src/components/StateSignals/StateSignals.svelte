<script lang="ts">
  import clipboardState from "state/clipboard";

  function isStateMessage(event: MessageEvent) {
    return !!event?.data?.stateMessage;
  }

  function onMessage(event: MessageEvent) {
    if (isStateMessage(event)) {
      const { stateMessage: { type, data } } = event.data;
      if (type == "updateClipboardState" && typeof data == "string") {
        $clipboardState = data;
      }
    }
  }
</script>

<svelte:window on:message={onMessage} />
