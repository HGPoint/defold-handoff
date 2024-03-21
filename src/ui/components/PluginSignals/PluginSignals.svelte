<script lang="ts">
  import { isPluginMessage, isSelectionData, processPluginMessage } from '../../../utilities/plugin';

  export let selection: SelectionData;

  function onSelectionChange(newSelection: SelectionData) {
    selection = newSelection;
  }

  function onMessage(event: MessageEvent) {
    if (isPluginMessage(event)) {
      const { pluginMessage: { type, data } } = event.data;
      if (type === 'selectionChanged' && isSelectionData(data)) {
        onSelectionChange(data)
      } else {
        processPluginMessage(type, data)
      }
    }
  }
</script>

<svelte:window on:message={onMessage} />
