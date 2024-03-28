<script lang="ts">
  import selectionState from "state/selection";
  import { postMessageToPlugin } from "utilities/pluginUI";
  import { generateSectionProperties } from "utilities/components";
  import Page from "components/Page";
  import Properties from "components/Properties";
  import Actions from "components/Actions";
  import ActionButton from "components/ActionButton";
  import ToggleProperty from "components/ToggleProperty";
  import TextProperty from "components/TextProperty";

  let properties: ReturnType<typeof generateSectionProperties>;
  let lastSentProperties: typeof properties;

  function shouldSendProperties(updateProperties: typeof properties) {
    return JSON.stringify(lastSentProperties) !== JSON.stringify(updateProperties);
  }

  function tryUpdatePlugin(updateProperties: typeof properties) {
    if (shouldSendProperties(updateProperties)) {
      postMessageToPlugin("updateSection", { section: { ...updateProperties } });
      lastSentProperties = JSON.parse(JSON.stringify(updateProperties));
    }
  }

  selectionState.subscribe((value) => {
    const sections = value.sections[0];
    const newProperties = generateSectionProperties(sections);
    lastSentProperties = JSON.parse(JSON.stringify(newProperties));
    properties = newProperties;
  })

  $: tryUpdatePlugin(properties);
</script>

<Page>
  <Properties>
    <ToggleProperty label="Bundled" bind:value={properties.bundled} />
    <TextProperty label="Jumbo" bind:value={properties.jumbo} />
  </Properties>
  <Actions>
    <ActionButton label="Export Atlases" action="exportAtlases" />
    <ActionButton label="Fix Atlases" action="fixAtlases" disabled={true} />
    <ActionButton label="Validate Atlases" action="validateAtlases" disabled={true} />
    <ActionButton label="Destroy Atlases" action="destroyAtlases" />
    <ActionButton label="Reset Section" action="resetSections" />
  </Actions>
</Page>
