<script lang="ts">
  import ActionButton from "components/ActionButton";
  import Actions from "components/Actions";
  import Page from "components/Page";
  import selectionState from "state/selection";
  import { areMultipleLayersSelected, isLayerSelected } from "utilities/selection";
</script>

<Page>
  <Actions title="Tools" collapseKey="atlasToolsCollapsed">
    {#if isLayerSelected($selectionState) || areMultipleLayersSelected($selectionState)}
      <ActionButton label="Add Sprites to Atlas" action="addSprites" />
    {/if}
    <ActionButton label="Fix Atlas" action="fixAtlases" />
    <ActionButton label="Sort Atlas Alphabetically" action="sortAtlasesAlphabet" />
    <ActionButton label="Sort Atlas By Size" action="sortAtlasesSize" />
    <ActionButton label="Fit Atlas" action="fitAtlases" />
  </Actions>
</Page>
