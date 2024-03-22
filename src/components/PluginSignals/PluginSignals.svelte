<script lang="ts">
  import { isPluginMessage, isPluginMessagePayload, isSelectionData, processPluginMessage } from "utilities/plugin";

  export let selection: SelectionData;

  function processSelectionChange(data: PluginMessagePayload) {
    const { selection: selectionUpdate } = data;
    if (isSelectionData(selectionUpdate)) {
      selection = selectionUpdate;
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
