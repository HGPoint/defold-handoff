<script lang="ts">
  import selectionState from "state/selection";
  import { isGUINodeSelected } from "utilities/selection";
  import Slice9Editor from "components/Slice9Editor";
    import { postMessageToPlugin } from "utilities/pluginUI";

  function requestImage(gui: PluginGUINodeData) {
    postMessageToPlugin("requestImage")
  }

  $: gui = $selectionState?.gui[0];
  $: requestImage(gui);
</script>

{#if isGUINodeSelected($selectionState)}
  <Slice9Editor label={gui.id} bind:value={gui.slice9} />
{/if}