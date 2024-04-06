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

  let properties: Required<PluginGUINodeData> | null;
  let lastSentProperties: Required<PluginGUINodeData> | null;
  let fontFamilies: Record<string, string> = {};

  function shouldSendProperties(updateProperties: PluginGUINodeData | null) {
    return JSON.stringify(lastSentProperties) !== JSON.stringify(updateProperties);
  }

  function tryUpdatePlugin(updateProperties: PluginGUINodeData | null) {
    if (shouldSendProperties(updateProperties)) {
      postMessageToPlugin("updateGUINode", { guiNode: { ...JSON.parse(JSON.stringify(updateProperties)) } });
      lastSentProperties = JSON.parse(JSON.stringify(updateProperties));
    }
  }

  selectionState.subscribe((selection) => {
    if (selection) {
      const { gui: [ gui ], project } = selection;
      if (gui) {
        const newProperties = JSON.parse(JSON.stringify(gui));
        lastSentProperties = JSON.parse(JSON.stringify(newProperties));
        properties = newProperties;
      } else {
        properties = null;
      }
      if (project) {
        fontFamilies = project.fontFamilies.reduce((fonts, font) => ({ ...fonts, [font]: font }), {})
      }
    }
  })

  $: tryUpdatePlugin(properties);
</script>

{#if properties}
  <Page>
    <Properties>
      <TextProperty label="Id" bind:value={properties.id} />
      <TransformationProperty label="Scale" bind:value={properties.scale} disabled={true} />
      <OptionsProperty label="Size Mode" bind:value={properties.size_mode} options={config.sizeModes} />
      <ToggleProperty label="Enabled" bind:value={properties.enabled} />
      <ToggleProperty label="Visible" bind:value={properties.visible} />
      {#if isTextGUINode(properties.type)}
        <OptionsProperty label="Font" bind:value={properties.font} options={fontFamilies} />
      {/if}
      <OptionsProperty label="Material" bind:value={properties.material} options={{}} disabled={true} />
      {#if isBoxGUINode(properties.type)}
        <SidesProperty label="Slice 9" bind:value={properties.slice9} />
      {/if}
      <ToggleProperty label="Inherit Alpha" bind:value={properties.inherit_alpha} />
      <OptionsProperty label="Layer" bind:value={properties.layer} options={{}} disabled={true} />
      <OptionsProperty label="Blend Mode" bind:value={properties.blend_mode} options={config.blendModes} />
      {#if isBoxGUINode(properties.type)}
        <OptionsProperty label="Pivot" bind:value={properties.pivot} options={config.pivots} />
      {/if}
      <OptionsProperty label="X Anchor" bind:value={properties.xanchor} options={config.xAnchors} />
      <OptionsProperty label="Y Anchor" bind:value={properties.yanchor} options={config.yAnchors} />
      <OptionsProperty label="Adjust Mode" bind:value={properties.adjust_mode} options={config.adjustModes} />
      <OptionsProperty label="Clipping Mode" bind:value={properties.clipping_mode} options={config.clippingModes} />
      <ToggleProperty label="Clipping Inverted" bind:value={properties.clipping_inverted} />
    </Properties>
    <Properties title="Special Properties">
      <ToggleProperty label="Skip" bind:value={properties.skip} />
      <ToggleProperty label="Cloneable" bind:value={properties.cloneable} />
      <ToggleProperty label="Template" bind:value={properties.template} />
      {#if properties.template}
        <TextProperty label="Template Name" bind:value={properties.template_name} />
        <TextProperty label="Template Path" bind:value={properties.template_path} />
      {/if}
      <ToggleProperty label="Wrapper" bind:value={properties.wrapper} disabled={true} />
      {#if properties.wrapper}
        <SidesProperty label="Wrapper Padding" bind:value={properties.wrapper_padding} disabled={true} />
      {/if}
    </Properties>
    <Actions title="Tools">
      {#if isTextGUINode(properties.type)}
        <ActionButton label="Fix Text Node" action="fixTextNode" />
      {/if}
      {#if isBoxGUINode(properties.type)}
        <ActionButton label="Restore Slice9" action="restoreSlice9Node" />
      {/if}
      <ActionButton label="Fix GUI Node" action="fixGUINodes" />
      <ActionButton label="Validate GUI Node" action="validateGUINodes" disabled={true} />
      <ActionButton label="Reset GUI Node" action="resetGUINodes" />
    </Actions>
    <Actions>
      <ActionButton label="Copy GUI Node" action="copyGUINodes" />
      <ActionButton label="Export GUI Node" action="exportGUINodes" />
      <ActionButton label="Export GUI Node Bundle" action="exportBundle" />
      <ActionButton label="Copy GUI Node Scheme" action="copyGUINodeScheme" />
      <ActionButton label="Show GUI Node Data" action="showGUINodeData" />
    </Actions>
  </Page>
{/if}
