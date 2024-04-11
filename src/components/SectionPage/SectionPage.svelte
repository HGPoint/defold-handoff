<script lang="ts">
  import selectionState from "state/selection";
  import { postMessageToPlugin } from "utilities/pluginUI";
  import Page from "components/Page";
  import Properties from "components/Properties";
  import Actions from "components/Actions";
  import ActionButton from "components/ActionButton";
  import ToggleProperty from "components/ToggleProperty";
  import TextProperty from "components/TextProperty";

  function tryUpdatePlugin(updateProperties: PluginSectionData | null) {
    postMessageToPlugin("updateSection", { section: { ...JSON.parse(JSON.stringify(updateProperties)) } });
  }

  $: properties = $selectionState.sections[0];
  $: tryUpdatePlugin(properties);
</script>

{#if properties}
  <Page>
    <Properties title="Atlas Section Properties" collapseKey="sectionAtlasPropertiesCollapsed">
      <ToggleProperty label="Bundled Atlases" bind:value={properties.bundled} />
      <TextProperty label="Combine As" bind:value={properties.jumbo} />
    </Properties>
    <Actions title="Tools" collapseKey="sectionToolsCollapsed">
      <ActionButton label="Fix Atlases" action="fixAtlases" />
      <ActionButton label="Validate Atlases" action="validateAtlases" disabled={true} />
      <ActionButton label="Reset Section" action="resetSections" />
    </Actions>
    <Actions collapseKey="sectionActionsCollapsed">
      <ActionButton label="Export Atlases" action="exportAtlases" />
      <ActionButton label="Destroy Atlases" action="destroyAtlases" />
    </Actions>
  </Page>
{/if}