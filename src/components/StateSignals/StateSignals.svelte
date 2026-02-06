<script lang="ts">
  import clipboardState from "state/clipboard";

  function onMessage(event: MessageEvent) {
    if (event.data.StateMessage) {
      const { type, data } = event.data.StateMessage;
      if (type == "updateClipboardState" && typeof data == "string") {
        $clipboardState = data;
      }
    }
  }
</script>

<svelte:window on:message={onMessage} />
