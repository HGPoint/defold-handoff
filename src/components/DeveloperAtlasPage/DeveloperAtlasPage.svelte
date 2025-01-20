<script lang="ts">
  import ActionButton from "components/ActionButton";
  import ActionOptionButton from "components/ActionOptionButton";
  import Actions from "components/Actions";
  import Page from "components/Page";
  import Properties from "components/Properties";
  import TextProperty from "components/TextProperty";
  import ToggleProperty from "components/ToggleProperty";
  import selectionState from "state/selection";
  import { areMultipleLayersSelected, isLayerSelected } from "utilities/selection";
  import { postMessageToPlugin } from "utilities/ui";

  let { atlases: [ atlas ] } = $selectionState;
  let lastSentUpdate = JSON.stringify(atlas);

  function shouldSendUpdate() {
    const sectionString = JSON.stringify(atlas);
    if (sectionString !== lastSentUpdate) {
      lastSentUpdate = sectionString;
      return true;
    }
    return false;
  }
  
  function updatePlugin(updateProperties: WithNull<PluginAtlasData>) {
    if (shouldSendUpdate()) {
      postMessageToPlugin("updateAtlas", { atlas });
    }
  }

  function updateData(selection: SelectionUIData) {
    ({ atlases: [ atlas ] } = $selectionState);
  }

  $: updateData($selectionState);
  $: updatePlugin(atlas);
</script>

<Page>
  <Properties collapseKey="atlasPropertiesCollapsed">
    <TextProperty label="Extension" bind:value={atlas.extension} />
    <ToggleProperty label="Ignore in Bundles" bind:value={atlas.ignore} />
  </Properties>
  <Actions title="Tools" collapseKey="atlasToolsCollapsed">
    {#if isLayerSelected($selectionState) || areMultipleLayersSelected($selectionState)}
      <ActionButton label="Add Sprites to Atlas" action="addSprites" />
    {/if}
    <ActionButton label="Fix Atlas" action="fixAtlases" />
    <ActionButton label="Sort Atlas" action="sortAtlases" />
    <ActionButton label="Fit Atlas" action="fitAtlases" />
    <ActionButton label="Validate Atlas" action="validateAtlases" disabled={true} />
  </Actions>
  <Actions collapseKey="atlasActionsCollapsed">
    <ActionButton label="Export Atlas" action="exportAtlases" />
    <ActionOptionButton label="Export Sprites at Scale" value={1} action="exportSprites" />
    <ActionButton label="Destroy Atlas" action="removeAtlases" />
  </Actions>
</Page>
