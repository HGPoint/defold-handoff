<script lang="ts">
  import selectionState from "state/selection";
  import { isGUITextNodeType, isGUIBoxNodeType } from "utilities/gui";
  import { isZeroVector } from "utilities/math";
  import { postMessageToPlugin } from "utilities/pluginUI";
  import Slice9Editor from "components/Slice9Editor";
  import Actions from "components/Actions";
  import ActionButton from "components/ActionButton";

  let { gui: [ guiNode ] } = $selectionState
  let lastSentUpdate = JSON.stringify(guiNode);

  function shouldSendUpdate() {
    const guiNodeString = JSON.stringify(guiNode);
    if (guiNodeString !== lastSentUpdate) {
      lastSentUpdate = guiNodeString;
      return true;
    }
    return false;
  }

  function requestImage(guiData: PluginGUINodeData | null) {
    if (guiNode) {
      postMessageToPlugin("requestImage")
    }
  }

    function updatePlugin(updatedProperties: PluginGUINodeData | null) {
    if (shouldSendUpdate()) {
      postMessageToPlugin("updateGUINode", { guiNode });
    }
  }

  function updateData(selection: SelectionUIData) {
    ({ gui: [ guiNode ] } = $selectionState);
  }

  $: updateData($selectionState);
  $: updatePlugin(guiNode);
  $: requestImage(guiNode);
</script>

<Slice9Editor label={guiNode.id} bind:value={guiNode.slice9} />
<Actions title="Tools" collapseKey="guiNodeToolsCollapsed">
  {#if isGUITextNodeType(guiNode.type)}
    <ActionButton label="Fix Text" action="fixTextNode" />
  {/if}
  {#if isGUIBoxNodeType(guiNode.type) && !isZeroVector(guiNode.slice9)}
    <ActionButton label="Refresh Slice 9" action="restoreSlice9Node" />
  {/if}
</Actions>