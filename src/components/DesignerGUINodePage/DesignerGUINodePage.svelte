<script lang="ts">
  import selectionState from "state/selection";
  import { isTextGUINode, isBoxGUINode } from "utilities/gui";
  import { postMessageToPlugin } from "utilities/pluginUI";
  import Slice9Editor from "components/Slice9Editor";
  import Actions from "components/Actions";
  import ActionButton from "components/ActionButton";

  let gui: PluginGUINodeData;

  function requestImage(guiData: PluginGUINodeData | null) {
    if (gui) {
      postMessageToPlugin("requestImage")
    }
  }

  function updateData(selection: SelectionUIData) {
    ({ gui: [ gui ] } = $selectionState);
  }

  $: updateData($selectionState);
  $: requestImage(gui);
</script>

<Slice9Editor label={gui.id} bind:value={gui.slice9} />
<Actions title="Tools" collapseKey="guiNodeToolsCollapsed">
  {#if isTextGUINode(gui.type)}
    <ActionButton label="Fix Text" action="fixTextNode" />
  {/if}
  {#if isBoxGUINode(gui.type)}
    <ActionButton label="Refresh Slice 9" action="restoreSlice9Node" />
  {/if}
</Actions>