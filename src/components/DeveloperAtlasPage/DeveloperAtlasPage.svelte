<script lang="ts">
  import selectionState from "state/selection";
  import Page from "components/Page";
  import Actions from "components/Actions";
  import ActionButton from "components/ActionButton";
  import ActionOptionButton from "components/ActionOptionButton";
  import { isLayerSelected, areMultipleLayersSelected } from "utilities/selection";
</script>

<Page>
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
    <ActionButton label="Destroy Atlas" action="destroyAtlases" />
  </Actions>
</Page>
