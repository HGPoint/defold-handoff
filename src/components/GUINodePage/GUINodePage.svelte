<script lang="ts">
  import config from "config/config.json";
  import selectionState from "state/selection";
  import { postMessageToPlugin } from "utilities/pluginUI";
  import { generateGUINodeProperties } from "utilities/components";
  import Page from "components/Page";
  import Properties from "components/Properties";
  import Actions from "components/Actions";
  import ActionButton from "components/ActionButton";
  import OptionsProperty from "components/OptionsProperty";
  import ToggleProperty from "components/ToggleProperty";
  import TransformationProperty from "components/TransformationProperty";
  import Slice9Property from "components/Slice9Property";
  import TextProperty from "components/TextProperty";

  let properties: ReturnType<typeof generateGUINodeProperties>;
  let type: "box" | "text" | undefined;
  let lastSentProperties: typeof properties;

  function shouldSendProperties(updateProperties: typeof properties) {
    return JSON.stringify(lastSentProperties) !== JSON.stringify(updateProperties);
  }

  function tryUpdatePlugin(updateProperties: typeof properties) {
    if (shouldSendProperties(updateProperties)) {
      postMessageToPlugin("updateGUINode", { guiNode: { ...updateProperties } });
      lastSentProperties = JSON.parse(JSON.stringify(updateProperties));
    }
  }

  selectionState.subscribe((value) => {
    const gui = value.gui[0];
    const newProperties = generateGUINodeProperties(gui);
    lastSentProperties = JSON.parse(JSON.stringify(newProperties));
    properties = newProperties;
    type = gui && gui.type;
  })

  $: tryUpdatePlugin(properties);
</script>

<Page>
  <Properties>
    <TextProperty label="Id" bind:value={properties.id} />
    <ToggleProperty label="Skip" value={false} disabled={true} />
    <TransformationProperty label="Scale" bind:value={properties.scale} disabled={true} />
    <ToggleProperty label="Enabled" bind:value={properties.enabled} />
    <ToggleProperty label="Visible" bind:value={properties.visible} />
    <OptionsProperty label="Material" bind:value={properties.material} options={{}} disabled={true} />
    {#if type !== "text"}
      <Slice9Property label="Slice 9" bind:value={properties.slice9} />
    {/if}
    <ToggleProperty label="Inherit Alpha" bind:value={properties.inherit_alpha} />
    <OptionsProperty label="Layer" bind:value={properties.layer} options={{}} disabled={true} />
    <OptionsProperty label="Blend Mode" bind:value={properties.blend_mode} options={config.blendModes} />
    {#if type !== "text"}
      <OptionsProperty label="Pivot" bind:value={properties.pivot} options={config.pivots} />
    {/if}
    <OptionsProperty label="X Anchor" bind:value={properties.xanchor} options={config.xAnchors} />
    <OptionsProperty label="Y Anchor" bind:value={properties.yanchor} options={config.yAnchors} />
    <OptionsProperty label="Adjust Mode" bind:value={properties.adjust_mode} options={config.adjustModes} />
    <OptionsProperty label="Clipping Mode" bind:value={properties.clipping_mode} options={config.clippingModes} />
    <ToggleProperty label="Clipping Inverted" bind:value={properties.clipping_inverted} />
  </Properties>
  <Actions>
    {#if type === "text"}
      <ActionButton label="Fix Text Node" action="fixTextNode" />
    {/if}
    {#if type !== "text"}
      <ActionButton label="Restore Slice9" action="restoreSlice9Node" />
    {/if}
    <ActionButton label="Copy GUI Node" action="copyGUINodes" />
    <ActionButton label="Export GUI Node" action="exportGUINodes" />
    <ActionButton label="Export GUI Node Bundle" action="exportBundle" />
    <ActionButton label="Fix GUI Node" action="fixGUINodes" disabled={true} />
    <ActionButton label="Validate GUI Node" action="validateGUINodes" disabled={true} />
    <ActionButton label="Reset GUI Node" action="resetGUINodes" />
    <ActionButton label="Show GUI Node Data" action="showGUINodeData" />
  </Actions>
</Page>
