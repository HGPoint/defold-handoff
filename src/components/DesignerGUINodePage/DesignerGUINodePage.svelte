<script lang="ts">
  import ActionButton from "components/ActionButton";
  import Actions from "components/Actions";
  import Slice9Editor from "components/Slice9Editor";
  import selectionState from "state/selection";
  import { isGUIBoxType, isGUITemplateType, isGUITextType } from "utilities/gui";
  import { isZeroVector } from "utilities/math";
  import { postMessageToPlugin } from "utilities/ui";

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

  function requestImage(guiData: WithNull<PluginGUINodeData>) {
    if (guiNode) {
      postMessageToPlugin("requestImage")
    }
  }

    function updatePlugin(updatedProperties: WithNull<PluginGUINodeData>) {
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
  {#if isGUITextType(guiNode.type)}
    <ActionButton label="Fix Text" action="fixGUIText" />
  {/if}
  {#if (isGUIBoxType(guiNode.type) || isGUITemplateType(guiNode.type)) && !isZeroVector(guiNode.slice9)}
    <ActionButton label="Refresh Slice 9" action="restoreSlice9" />
  {/if}
  <ActionButton label="Export GUI as Spine" action="exportGUISpine" />
</Actions>