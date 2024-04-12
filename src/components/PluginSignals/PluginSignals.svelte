<script lang="ts">
  import uiState from "state/ui"
  import selectionState from "state/selection"
  import imageState from "state/image";
  import { isPluginMessage, isPluginMessagePayload, isSelectionData, isUpdatedSelection, isUIMode, processPluginMessage } from "utilities/pluginUI";

  function processSelectionChange(data: PluginMessagePayload) {
    const { selection } = data;
    if (isSelectionData(selection) && isUpdatedSelection($selectionState, selection)) {
      $selectionState = selection;
      $imageState = null;
    }
  }

  function processModeChange(data: PluginMessagePayload) {
    const { mode } = data;
    if (isUIMode(mode)) {
      $uiState.mode = mode;
    }
  }

  function processRequestedImage(data: PluginMessagePayload) {
    const { image } = data;
    if (image) {
      $imageState = image;
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
        } else if (type === "requestedImage") {
          processRequestedImage(data);
        } else {
          processPluginMessage(type, data)
        }
      }
    }
  }
</script>

<svelte:window on:message={onMessage} />
