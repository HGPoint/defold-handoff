<script lang="ts">
  import config from "config/config.json";
  import { postMessageToPlugin, generateGUINodeProperties } from "utilities/plugin";
  import Section from "components/Section";
  import Button from "components/Button";
  import OptionsProperty from "components/OptionsProperty";
  import ToggleProperty from "components/ToggleProperty";

  export let selection: SelectionUIData;
  const gui = selection.gui[0];

  const properties = generateGUINodeProperties(gui);

  $: postMessageToPlugin("updateGUINode", { guiNode: { ...properties } });

  function onCopyGUINode() {
    postMessageToPlugin("copyGUINodes");
  }

  function onExportGUINode() {
    postMessageToPlugin("exportGUINodes");
  }

  function onExportGUINodeBundle() {
    postMessageToPlugin("exportBundle");
  }

  function onResetGUINode() {
    postMessageToPlugin("resetGUINodes");
  }
</script>

<Section>
  <div class="properties">
    <ToggleProperty label="Enabled" bind:value={properties.enabled} />
    <ToggleProperty label="Visible" bind:value={properties.visible} />
    <ToggleProperty label="Inherit Alpha" bind:value={properties.inherit_alpha} />
    <OptionsProperty label="Blend Mode" bind:value={properties.blend_mode} options={config.blendModes} />
  </div>
  <div class="actions">
    <Button label="Copy GUI Node" onClick={onCopyGUINode} />
    <Button label="Export GUI Node" onClick={onExportGUINode} />
    <Button label="Export GUI Node Bundle" onClick={onExportGUINodeBundle} />
    <Button label="Reset GUI Node" onClick={onResetGUINode} />
  </div>
</Section>
