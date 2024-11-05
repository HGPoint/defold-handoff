<script lang="ts">
  import imageState from "state/image";
  import selectionState from "state/selection";
  import uiState from "state/ui";
  import { isPluginMessage, isPluginMessagePayload, isSelectionUIData, isSelectionUpdated, isUIMode, onPluginMessage } from "utilities/ui";

  function onMessage(event: MessageEvent) {
    if (isPluginMessage(event)) {
      const { pluginMessage: { type, data } } = event.data;
      if (isPluginMessagePayload(data)) {
        if (type === "selectionChanged") {
          onSelectionChanged(data)
        } else if (type === "modeChanged") {
          onModeChanged(data);
        } else if (type === "imageExtracted") {
          onImageExtracted(data);
        } else {
          onPluginMessage(type, data)
        }
      }
    }
  }

  function onSelectionChanged(data: PluginMessagePayload) {
    const { selection } = data;
    if (isSelectionUIData(selection) && isSelectionUpdated(selection, $selectionState)) {
      $selectionState = selection;
      $imageState = null;
    }
  }

  function onModeChanged(data: PluginMessagePayload) {
    const { mode } = data;
    if (isUIMode(mode)) {
      $uiState.mode = mode;
    }
  }

  function onImageExtracted(data: PluginMessagePayload) {
    const { image } = data;
    if (image) {
      $imageState = image;
    }
  }
</script>

<svelte:window on:message={onMessage} />
