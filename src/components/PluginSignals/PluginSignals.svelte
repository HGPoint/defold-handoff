<script lang="ts">
  import uiState from "state/ui"
  import selectionState from "state/selection"
  import { isPluginMessage, isPluginMessagePayload, isSelectionData, isUIMode, processPluginMessage } from "utilities/pluginUI";

  function processSelectionChange(data: PluginMessagePayload) {
    const { selection } = data;
    if (isSelectionData(selection)) {
      $selectionState = selection;
    }
  }

  function processModeChange(data: PluginMessagePayload) {
    const { mode } = data;
    if (isUIMode(mode)) {
      $uiState.mode = mode;
    }
  }

  function onMessage(event: MessageEvent) {
    if (isPluginMessage(event)) {
      const { pluginMessage: { type, data } } = event.data;
      if (isPluginMessagePayload(data)) {
        if (type === "selectionChanged") {
          processSelectionChange(data)
        } else if (type === "modeChanged") {
          processModeChange(data);
        } else {
          processPluginMessage(type, data)
        }
      }
    }
  }
</script>

<svelte:window on:message={onMessage} />
