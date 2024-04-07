<script lang="ts">
  import selectionState from "state/selection";
  import { postMessageToPlugin } from "utilities/pluginUI";
  import Page from "components/Page";
  import Properties from "components/Properties";
  import Actions from "components/Actions";
  import ActionButton from "components/ActionButton";
  import ToggleProperty from "components/ToggleProperty";
  import TextProperty from "components/TextProperty";

  let properties: Required<PluginSectionData> | null;
  let lastSentProperties: Required<PluginSectionData> | null;

  function shouldSendProperties(updateProperties: PluginSectionData | null) {
    return JSON.stringify(lastSentProperties) !== JSON.stringify(updateProperties);
  }

  function tryUpdatePlugin(updateProperties: PluginSectionData | null) {
    if (properties && shouldSendProperties(updateProperties)) {
      postMessageToPlugin("updateSection", { section: { ...JSON.parse(JSON.stringify(updateProperties)) } });
      lastSentProperties = JSON.parse(JSON.stringify(updateProperties));
    }
  }

  selectionState.subscribe((value) => {
    const [ sections ] = value.sections;
    if (sections) {
      const newProperties = JSON.parse(JSON.stringify(sections));
      lastSentProperties = JSON.parse(JSON.stringify(newProperties));
      properties = newProperties;
    } else {
      properties = null;
    }
  })

  $: tryUpdatePlugin(properties);
</script>

{#if properties}
  <Page>
    <Properties title="Atlas Section Properties">
      <ToggleProperty label="Bundled Atlases" bind:value={properties.bundled} />
      <TextProperty label="Combine As" bind:value={properties.jumbo} />
    </Properties>
    <Actions title="Tools">
      <ActionButton label="Fix Atlases" action="fixAtlases" />
      <ActionButton label="Validate Atlases" action="validateAtlases" disabled={true} />
      <ActionButton label="Reset Section" action="resetSections" />
    </Actions>
    <Actions>
      <ActionButton label="Export Atlases" action="exportAtlases" />
      <ActionButton label="Destroy Atlases" action="destroyAtlases" />
    </Actions>
  </Page>
{/if}