<script lang="ts">
  import selectionState from "state/selection";
  import Page from "components/Page";
  import Actions from "components/Actions";
  import ActionButton from "components/ActionButton";
    import { isLayerSelected, areMultipleLayersSelected } from "utilities/selection";
</script>

<Page>
  <Actions title="Tools" collapseKey="atlasToolsCollapsed">
    {#if isLayerSelected($selectionState) || areMultipleLayersSelected($selectionState)}
      <ActionButton label="Add Sprites to Atlas" action="addSprites" />
    {/if}
    <ActionButton label="Fix Atlas" action="fixAtlases" />
    <ActionButton label="Sort Atlas" action="sortAtlases" />
  </Actions>
</Page>
