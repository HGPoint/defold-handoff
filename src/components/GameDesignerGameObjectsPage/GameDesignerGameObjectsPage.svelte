<script lang="ts">
  import ActionButton from "components/ActionButton";
  import Actions from "components/Actions";
  import Page from "components/Page";
  import selectionState from "state/selection";
</script>

<Page>
  <Actions title="Tools" collapseKey="gameObjectsToolsCollapsed">
    <ActionButton label="Infer Properties" action="fixGameObjects" />
    <ActionButton label="Reset Collection" action="removeGameObjects" />
  </Actions>
  <Actions collapseKey="gameObjectsActionsCollapsed">
    <ActionButton label="Export Collections" action="exportGameCollections" />
    <ActionButton label="Export Bundle" action="exportBundle" />
  </Actions>
  {#if $selectionState.layers.length > 1}
    <Actions title="Atlas Actions" collapseKey="layersActionsCollapsed">
      <ActionButton label="Create Atlas" action="createAtlas" />
    </Actions>
  {/if}
</Page>
