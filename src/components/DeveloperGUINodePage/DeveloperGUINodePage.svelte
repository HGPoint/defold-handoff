<script lang="ts">
  import config from "config/config.json";
  import selectionState from "state/selection";
  import { postMessageToPlugin } from "utilities/pluginUI";
  import { isTextGUINodeType, isBoxGUINodeType, isFigmaComponentInstanceType } from "utilities/gui";
    import { isZeroVector } from "utilities/math";
  import Page from "components/Page";
  import Properties from "components/Properties";
  import Actions from "components/Actions";
  import ActionButton from "components/ActionButton";
  import OptionsProperty from "components/OptionsProperty";
  import ToggleProperty from "components/ToggleProperty";
  import TransformationProperty from "components/TransformationProperty";
  import SidesProperty from "components/SidesProperty";
  import TextProperty from "components/TextProperty";
  import PropertyTip from "components/PropertyTip";

  let { gui: [ guiNode ] } = $selectionState;
  let fontFamilies: Record<string, string>;
  let layers: Record<string, string>;
  let materials: Record<string, string>;
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
    fontFamilies = $selectionState.project.fontFamilies.reduce((fonts, font) => ({ ...fonts, [font.name]: font.id }), {});
    layers = $selectionState.context ? $selectionState.context.layers.reduce((layerOptions, layer) => ({ ...layerOptions, [layer.name]: layer.id }), {}) : {};
    materials = $selectionState.context ? $selectionState.context.materials.reduce((materialOptions, material) => ({ ...materialOptions, [material.name]: material.id }), {}) : {};
  }

  $: updateData($selectionState);
  $: updatePlugin(guiNode);
</script>

{#if guiNode}
  <Page>
    <Properties collapseKey="guiNodePropertiesCollapsed">
      <TextProperty label="Id" bind:value={guiNode.id} />
      <TransformationProperty label="Scale" bind:value={guiNode.scale} disabled={true} />
      <OptionsProperty label="Size Mode" bind:value={guiNode.size_mode} options={config.sizeModes} />
      <ToggleProperty label="Enabled" bind:value={guiNode.enabled} />
      <ToggleProperty label="Visible" bind:value={guiNode.visible} />
      {#if isTextGUINodeType(guiNode.type)}
        <OptionsProperty label="Font" bind:value={guiNode.font} options={fontFamilies} />
      {/if}
      <OptionsProperty label="Material" bind:value={guiNode.material} options={materials} disabled={true} />
      {#if isBoxGUINodeType(guiNode.type)}
        <SidesProperty label="Slice 9" bind:value={guiNode.slice9} />
      {/if}
      <ToggleProperty label="Inherit Alpha" bind:value={guiNode.inherit_alpha} />
      <OptionsProperty label="Layer" bind:value={guiNode.layer} options={layers} />
      <OptionsProperty label="Blend Mode" bind:value={guiNode.blend_mode} options={config.blendModes} />
      {#if isBoxGUINodeType(guiNode.type)}
        <OptionsProperty label="Pivot" bind:value={guiNode.pivot} options={config.pivots} />
      {/if}
      <OptionsProperty label="X Anchor" bind:value={guiNode.xanchor} options={config.xAnchors} />
      <OptionsProperty label="Y Anchor" bind:value={guiNode.yanchor} options={config.yAnchors} />
      <OptionsProperty label="Adjust Mode" bind:value={guiNode.adjust_mode} options={config.adjustModes} />
      <OptionsProperty label="Clipping Mode" bind:value={guiNode.clipping_mode} options={config.clippingModes} />
      <ToggleProperty label="Clipping Inverted" bind:value={guiNode.clipping_inverted} />
    </Properties>
    <Properties title="Special Properties" collapseKey="guiNodeSpecialPropertiesCollapsed">
      <ToggleProperty label="Don't Export" bind:value={guiNode.exclude} />
      <ToggleProperty label="On Screen" bind:value={guiNode.screen} disabled={guiNode.exclude} />
      <TextProperty label="Bundle Variants" bind:value={guiNode.export_variants} disabled={guiNode.exclude}>
        <PropertyTip>
          Comma separated pairs of component's properties (including from nested instances) and their values to add to the export. For example <code>Status=Multiple,Status=Disabled</code>
        </PropertyTip>
      </TextProperty>
      <ToggleProperty label="Skip" bind:value={guiNode.skip} disabled={guiNode.exclude} />
      <ToggleProperty label="Don't Collapse" bind:value={guiNode.fixed} disabled={guiNode.exclude} />
      <ToggleProperty label="Extract" bind:value={guiNode.cloneable} disabled={guiNode.exclude} />
      <ToggleProperty label="Template" bind:value={guiNode.template} disabled={guiNode.exclude} />
      {#if guiNode.template && !guiNode.exclude}
        <TextProperty label="Template Name" bind:value={guiNode.template_name} />
        <TextProperty label="Template Path" bind:value={guiNode.template_path} />
      {/if}
      <ToggleProperty label="Script" bind:value={guiNode.script} disabled={guiNode.exclude} />
      {#if guiNode.script && !guiNode.exclude}
        <TextProperty label="Script Name" bind:value={guiNode.script_name} />
        <TextProperty label="Script Path" bind:value={guiNode.script_path} />
      {/if}
      {#if !guiNode.template && !guiNode.exclude}
        <TextProperty label="Path" bind:value={guiNode.path} />
      {/if}
      <ToggleProperty label="Wrapper" bind:value={guiNode.wrapper} disabled={true || guiNode.exclude} />
      {#if guiNode.wrapper && !guiNode.exclude}
        <SidesProperty label="Wrapper Padding" bind:value={guiNode.wrapper_padding} disabled={true || guiNode.exclude} />
      {/if}
    </Properties>
    <Actions title="Tools" collapseKey="guiNodeToolsCollapsed">
      <ActionButton label="Infer Properties" action="fixGUINodes" />
      {#if $selectionState.canTryMatch}
        <ActionButton label="Match Parent to GUI Node" action="matchGUINodes" />
      {/if}
      <ActionButton label="Resize to Screen" action="resizeScreenNodes" />
      {#if isTextGUINodeType(guiNode.type)}
        <ActionButton label="Fix Text" action="fixTextNode" />
      {/if}
      {#if isBoxGUINodeType(guiNode.type) && !isZeroVector(guiNode.slice9)}
        <ActionButton label="Refresh Slice 9" action="restoreSlice9Node" />
      {/if}
      {#if isFigmaComponentInstanceType(guiNode.figma_node_type)}
        <ActionButton label="Pull GUI Data from Main Component" action="pullFromMainComponent" />
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
    {#if $selectionState.layers.length > 1}
      <Actions title="Atlas Actions" collapseKey="layersActionsCollapsed">
        <ActionButton label="Create Atlas" action="createAtlas" />
      </Actions>
    {/if}
  </Page>
{/if}
