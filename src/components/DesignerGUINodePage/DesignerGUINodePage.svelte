<script lang="ts">
  import selectionState from "state/selection";
  import { isTextGUINode, isBoxGUINode } from "utilities/gui";
  import { postMessageToPlugin } from "utilities/pluginUI";
  import Slice9Editor from "components/Slice9Editor";
  import Actions from "components/Actions";
  import ActionButton from "components/ActionButton";

  let { gui: [ guiNode ] } = $selectionState
  let lastRequestedImageGUI = JSON.stringify(guiNode);

  function shouldRequestImage() {
    if (guiNode !== null) {
      const guiNodeString = JSON.stringify(guiNode);
      if (guiNodeString !== lastRequestedImageGUI) {
        lastRequestedImageGUI = guiNodeString;
        return true;
      }
    }
    return false;
  }

  function requestImage(guiData: PluginGUINodeData | null) {
    if (guiNode) {
      postMessageToPlugin("requestImage")
    }
  }

  function updateData(selection: SelectionUIData) {
    ({ gui: [ guiNode ] } = $selectionState);
  }

  $: updateData($selectionState);
  $: requestImage(guiNode);
</script>

<Slice9Editor label={guiNode.id} bind:value={guiNode.slice9} />
<Actions title="Tools" collapseKey="guiNodeToolsCollapsed">
  {#if isTextGUINode(guiNode.type)}
    <ActionButton label="Fix Text" action="fixTextNode" />
  {/if}
  {#if isBoxGUINode(guiNode.type)}
    <ActionButton label="Refresh Slice 9" action="restoreSlice9Node" />
  {/if}
</Actions>