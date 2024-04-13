<script lang="ts">
  import config from "config/config.json";
  import selectionState from "state/selection";
  import { postMessageToPlugin } from "utilities/pluginUI";
  import { isTextGUINode, isBoxGUINode } from "utilities/gui";
  import Page from "components/Page";
  import Properties from "components/Properties";
  import Actions from "components/Actions";
  import ActionButton from "components/ActionButton";
  import OptionsProperty from "components/OptionsProperty";
  import ToggleProperty from "components/ToggleProperty";
  import TransformationProperty from "components/TransformationProperty";
  import SidesProperty from "components/SidesProperty";
  import TextProperty from "components/TextProperty";

  let { gui: [ guiNode ] } = $selectionState;
  let fontFamilies: Record<string, string>;
  let lastSentUpdate = JSON.stringify(guiNode);

  function shouldSendUpdate() {
    const guiNodeString = JSON.stringify(guiNode);
    if (guiNodeString !== lastSentUpdate) {
      lastSentUpdate = guiNodeString;
      return true;
    }
    return false;
  }

  function updatePlugin(updatedProperties: PluginGUINodeData | null) {
    if (shouldSendUpdate()) {
      postMessageToPlugin("updateGUINode", { guiNode });
    }
  }

  function updateData(selection: SelectionUIData) {
    ({ gui: [ guiNode ] } = $selectionState);
    fontFamilies = $selectionState.project.fontFamilies.reduce((fonts, font) => ({ ...fonts, [font]: font }), {});
  }

  $: updateData($selectionState);
  $: updatePlugin(guiNode);
</script>

{#if guiNode}
  <Page>
    <Properties collapseKey="guiNodePropertiesCollapsed">
      <TextProperty label="Id" bind:value={guiNode.id} />
      <TransformationProperty label="Scale" bind:value={guiNode.scale} />
      <OptionsProperty label="Size Mode" bind:value={guiNode.size_mode} options={config.sizeModes} />
      <ToggleProperty label="Enabled" bind:value={guiNode.enabled} />
      <ToggleProperty label="Visible" bind:value={guiNode.visible} />
      {#if isTextGUINode(guiNode.type)}
        <OptionsProperty label="Font" bind:value={guiNode.font} options={fontFamilies} />
      {/if}
      <OptionsProperty label="Material" bind:value={guiNode.material} options={{}} disabled={true} />
      {#if isBoxGUINode(guiNode.type)}
        <SidesProperty label="Slice 9" bind:value={guiNode.slice9} />
      {/if}
      <ToggleProperty label="Inherit Alpha" bind:value={guiNode.inherit_alpha} />
      <OptionsProperty label="Layer" bind:value={guiNode.layer} options={{}} disabled={true} />
      <OptionsProperty label="Blend Mode" bind:value={guiNode.blend_mode} options={config.blendModes} />
      {#if isBoxGUINode(guiNode.type)}
        <OptionsProperty label="Pivot" bind:value={guiNode.pivot} options={config.pivots} />
      {/if}
      <OptionsProperty label="X Anchor" bind:value={guiNode.xanchor} options={config.xAnchors} />
      <OptionsProperty label="Y Anchor" bind:value={guiNode.yanchor} options={config.yAnchors} />
      <OptionsProperty label="Adjust Mode" bind:value={guiNode.adjust_mode} options={config.adjustModes} />
      <OptionsProperty label="Clipping Mode" bind:value={guiNode.clipping_mode} options={config.clippingModes} />
      <ToggleProperty label="Clipping Inverted" bind:value={guiNode.clipping_inverted} />
    </Properties>
    <Properties title="Special Properties" collapseKey="guiNodeSpecialPropertiesCollapsed">
      <ToggleProperty label="On Screen" bind:value={guiNode.screen} />
      <ToggleProperty label="Skip" bind:value={guiNode.skip} />
      <ToggleProperty label="Extract" bind:value={guiNode.cloneable} />
      <ToggleProperty label="Template" bind:value={guiNode.template} />
      {#if guiNode.template}
        <TextProperty label="Template Name" bind:value={guiNode.template_name} />
        <TextProperty label="Template Path" bind:value={guiNode.template_path} />
      {/if}
      <ToggleProperty label="Wrapper" bind:value={guiNode.wrapper} disabled={true} />
      {#if guiNode.wrapper}
        <SidesProperty label="Wrapper Padding" bind:value={guiNode.wrapper_padding} disabled={true} />
      {/if}
    </Properties>
    <Actions title="Tools" collapseKey="guiNodeToolsCollapsed">
      <ActionButton label="Infer Properties" action="fixGUINodes" />
      {#if isTextGUINode(guiNode.type)}
      <ActionButton label="Fix Text" action="fixTextNode" />
      {/if}
      <ActionButton label="Refresh Slice 9" action="refreshSlice9Nodes" />
      {#if isBoxGUINode(guiNode.type)}
      <ActionButton label="Restore Slice 9" action="restoreSlice9Node" />
      {/if}
      <ActionButton label="Validate GUI" action="validateGUINodes" disabled={true} />
      <ActionButton label="Reset GUI Node" action="resetGUINodes" />
    </Actions>
    <Actions collapseKey="guiNodeActionsCollapsed">
      <ActionButton label="Export GUI" action="exportGUINodes" />
      <ActionButton label="Export Bundle" action="exportBundle" />
      <ActionButton label="Copy GUI" action="copyGUINodes" />
      <ActionButton label="Copy GUI Scheme" action="copyGUINodeScheme" />
    </Actions>
  </Page>
{/if}
