<script lang="ts">
  import selectionState from "state/selection";
  import { postMessageToPlugin } from "utilities/pluginUI";
  import Page from "components/Page";
  import Properties from "components/Properties";
  import Actions from "components/Actions";
  import ActionButton from "components/ActionButton";
  import ActionOptionButton from "components/ActionOptionButton";
  import ToggleProperty from "components/ToggleProperty";
  import TextProperty from "components/TextProperty";
  import TextSetProperty from "components/TextSetProperty";

  let { sections: [ section ] } = $selectionState;
  let lastSentUpdate = JSON.stringify(section);

  function shouldSendUpdate() {
    const sectionString = JSON.stringify(section);
    if (sectionString !== lastSentUpdate) {
      lastSentUpdate = sectionString;
      return true;
    }
    return false;
  }
  
  function updatePlugin(updateProperties: PluginSectionData | null) {
    if (shouldSendUpdate()) {
      postMessageToPlugin("updateSection", { section });
    }
  }

  function updateData(selection: SelectionUIData) {
    ({ sections: [ section ] } = $selectionState);
  }

  $: updateData($selectionState);
  $: updatePlugin(section);
</script>

{#if section}
  <Page>
    <Properties title="GUI Section Properties" collapseKey="sectionGUIPropertiesCollapsed">
      <ToggleProperty label="Ignore Prefixes" bind:value={section.ignorePrefixes} />
      <TextSetProperty label="Layers" action="Add Layer" bind:value={section.layers} />
      <TextSetProperty label="Materials" action="Add Material" bind:value={section.materials} disabled={true} />
    </Properties>
    <Properties title="Atlas Section Properties" collapseKey="sectionAtlasPropertiesCollapsed">
      <ToggleProperty label="Bundled Atlases" bind:value={section.bundled} />
      <TextProperty label="Combine As" bind:value={section.jumbo} />
    </Properties>
    <Actions title="Tools" collapseKey="sectionToolsCollapsed">
      <ActionButton label="Fix Atlases" action="fixAtlases" />
      <ActionButton label="Validate Atlases" action="validateAtlases" disabled={true} />
      <ActionButton label="Reset Section" action="resetSections" />
    </Actions>
    <Actions collapseKey="sectionActionsCollapsed">
      <ActionButton label="Export Atlases" action="exportAtlases" />
      <ActionOptionButton label="Export Sprites at Scale" value={1} action="exportSprites" />
      <ActionButton label="Destroy Atlases" action="destroyAtlases" />
    </Actions>
  </Page>
{/if}