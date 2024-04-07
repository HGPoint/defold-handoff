<script lang="ts">
  import selectionState from "state/selection";
  import Page from "components/Page";
  import Actions from "components/Actions";
  import ActionButton from "components/ActionButton";
    import { isLayerSelected, areMultipleLayersSelected } from "utilities/selection";

  let selection: SelectionUIData;

  selectionState.subscribe((value) => { selection = value; });
</script>

<Page>
  <Actions title="Tools">
    {#if isLayerSelected(selection) || areMultipleLayersSelected(selection)}
      <ActionButton label="Add Sprites to Atlas" action="addSprites" />
    {/if}
    <ActionButton label="Fix Atlas" action="fixAtlases" />
    <ActionButton label="Sort Atlas" action="sortAtlases" />
    <ActionButton label="Validate Atlas" action="validateAtlases" disabled={true} />
  </Actions>
  <Actions>
    <ActionButton label="Export Atlas" action="exportAtlases" />
    <ActionButton label="Destroy Atlas" action="destroyAtlases" />
  </Actions>
</Page>
