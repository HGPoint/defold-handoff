<script lang="ts">
  import selectionState from "state/selection"
  import { isPluginMessage, isPluginMessagePayload, isSelectionData, processPluginMessage } from "utilities/pluginUI";

  function processSelectionChange(data: PluginMessagePayload) {
    const { selection } = data;
    if (isSelectionData(selection)) {
      $selectionState = selection;
    }
  }

  function onMessage(event: MessageEvent) {
    if (isPluginMessage(event)) {
      const { pluginMessage: { type, data } } = event.data;
      if (isPluginMessagePayload(data)) {
        if (type === "selectionChanged") {
          processSelectionChange(data)
        } else {
          processPluginMessage(type, data)
        }
      }
    }
  }
</script>

<svelte:window on:message={onMessage} />
