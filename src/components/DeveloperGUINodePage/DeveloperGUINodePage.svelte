<script lang="ts">
  import config from "config/config.json";
  import selectionState from "state/selection";
  import { postMessageToPlugin } from "utilities/pluginUI";
  import { isTextGUINodeType, isBoxGUINodeType, isTemplateGUINodeType, isFigmaComponentInstanceType, isFigmaComponentType, isFigmaFrameType } from "utilities/gui";
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

  let { gui: [ guiNode ], originalValues } = $selectionState;
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

  function updatePlugin(updatedProperties: PluginGUINodeData) {
    if (shouldSendUpdate()) {
      postMessageToPlugin("updateGUINode", { guiNode });
    }
  }

  function updateData(selection: SelectionUIData) {
    ({ gui: [ guiNode ], originalValues } = $selectionState);
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
      <TransformationProperty label="Scale" bind:value={guiNode.scale} originalValue={originalValues?.scale} disabled={true} />
      <OptionsProperty label="Size Mode" bind:value={guiNode.size_mode} originalValue={originalValues?.size_mode} options={config.sizeModes} />
      <ToggleProperty label="Enabled" bind:value={guiNode.enabled} originalValue={originalValues?.enabled} />
      <ToggleProperty label="Visible" bind:value={guiNode.visible} originalValue={originalValues?.visible} />
      {#if isTextGUINodeType(guiNode.type)}
        <OptionsProperty label="Font" bind:value={guiNode.font} originalValue={originalValues?.font} options={fontFamilies} />
      {/if}
      <OptionsProperty label="Material" bind:value={guiNode.material} originalValue={originalValues?.material} options={materials} disabled={true} />
      {#if isBoxGUINodeType(guiNode.type) || isTemplateGUINodeType(guiNode.type)}
        <SidesProperty label="Slice 9" bind:value={guiNode.slice9} originalValue={originalValues?.slice9} />
      {/if}
      <ToggleProperty label="Inherit Alpha" bind:value={guiNode.inherit_alpha} originalValue={originalValues?.inherit_alpha} />
      <OptionsProperty label="Layer" bind:value={guiNode.layer} originalValue={originalValues?.layer} options={layers} />
      <OptionsProperty label="Blend Mode" bind:value={guiNode.blend_mode} originalValue={originalValues?.blend_mode} options={config.blendModes} />
      {#if isBoxGUINodeType(guiNode.type) || isTemplateGUINodeType(guiNode.type)}
        <OptionsProperty label="Pivot" bind:value={guiNode.pivot} originalValue={originalValues?.pivot} options={config.pivots} />
      {/if}
      <OptionsProperty label="X Anchor" bind:value={guiNode.xanchor} originalValue={originalValues?.xanchor} options={config.xAnchors} />
      <OptionsProperty label="Y Anchor" bind:value={guiNode.yanchor} originalValue={originalValues?.yanchor} options={config.yAnchors} />
      <OptionsProperty label="Adjust Mode" bind:value={guiNode.adjust_mode} originalValue={originalValues?.adjust_mode} options={config.adjustModes} />
      <OptionsProperty label="Clipping Mode" bind:value={guiNode.clipping_mode} originalValue={originalValues?.clipping_mode} options={config.clippingModes} />
      <ToggleProperty label="Clipping Inverted" bind:value={guiNode.clipping_inverted} originalValue={originalValues?.clipping_inverted} />
    </Properties>
    <Properties title="Special Properties" collapseKey="guiNodeSpecialPropertiesCollapsed">
      <ToggleProperty label="Don't Export" bind:value={guiNode.exclude} originalValue={originalValues?.exclude} />
      <ToggleProperty label="On Screen" bind:value={guiNode.screen} originalValue={originalValues?.screen} disabled={guiNode.exclude} />
      <TextProperty label="Bundle Variants" bind:value={guiNode.export_variants} originalValue={originalValues?.export_variants} disabled={guiNode.exclude}>
        <PropertyTip>
          Comma separated pairs of component's properties (including from nested instances) and their values to add to the export. For example <code>Status=Multiple,Status=Disabled</code>
        </PropertyTip>
      </TextProperty>
      <ToggleProperty label="Skip" bind:value={guiNode.skip} originalValue={originalValues?.skip} disabled={guiNode.exclude} />
      <ToggleProperty label="Don't Collapse" bind:value={guiNode.fixed} originalValue={originalValues?.fixed} disabled={guiNode.exclude} />
      <ToggleProperty label="Extract" bind:value={guiNode.cloneable} originalValue={originalValues?.cloneable} disabled={guiNode.exclude} />
      <ToggleProperty label="Template" bind:value={guiNode.template} originalValue={originalValues?.template} disabled={guiNode.exclude} />
      {#if guiNode.template && !guiNode.exclude}
        <TextProperty label="Template Name" bind:value={guiNode.template_name} originalValue={originalValues?.template_name} />
        <TextProperty label="Template Path" bind:value={guiNode.template_path} originalValue={originalValues?.template_path} />
      {/if}
      <ToggleProperty label="Script" bind:value={guiNode.script} originalValue={originalValues?.script} disabled={guiNode.exclude} />
      {#if guiNode.script && !guiNode.exclude}
        <TextProperty label="Script Name" bind:value={guiNode.script_name} originalValue={originalValues?.script_name} />
        <TextProperty label="Script Path" bind:value={guiNode.script_path} originalValue={originalValues?.script_path} />
      {/if}
      {#if !guiNode.template && !guiNode.exclude}
        <TextProperty label="Path" bind:value={guiNode.path} originalValue={originalValues?.path} />
      {/if}
      <ToggleProperty label="Wrapper" bind:value={guiNode.wrapper} originalValue={originalValues?.wrapper} disabled={true || guiNode.exclude} />
      {#if guiNode.wrapper && !guiNode.exclude}
        <SidesProperty label="Wrapper Padding" bind:value={guiNode.wrapper_padding} originalValue={originalValues?.wrapper_padding} disabled={true || guiNode.exclude} />
      {/if}
    </Properties>
    <Actions title="Tools" collapseKey="guiNodeToolsCollapsed">
      <ActionButton label="Infer Properties" action="fixGUINodes" />
      {#if $selectionState.canTryMatch}
        <ActionButton label="Match Parent to GUI Node" action="matchParentToGUINode" />
        <ActionButton label="Match GUI Node to Parent" action="matchGUINodeToParent" />
      {/if}
      <ActionButton label="Force Children on Screen" action="forceChildrenOnScreen" />
      {#if isFigmaFrameType(guiNode.figma_node_type) || isFigmaComponentType(guiNode.figma_node_type)}
        <ActionButton label="Resize to Screen" action="resizeScreenNodes" />
      {/if}
      {#if isTextGUINodeType(guiNode.type)}
        <ActionButton label="Fix Text" action="fixTextNode" />
      {/if}
      {#if (isBoxGUINodeType(guiNode.type) || isTemplateGUINodeType(guiNode.type)) && !isZeroVector(guiNode.slice9)}
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
      <ActionButton label="Export Atlases" action="exportGUINodeAtlases" />
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
