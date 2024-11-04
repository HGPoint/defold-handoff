<script lang="ts">
  import selectionState from "state/selection";
  import Page from "components/Page";
  import Actions from "components/Actions";
  import ActionButton from "components/ActionButton";
</script>

<Page>
  <Actions title="Tools" collapseKey="gameObjectsToolsCollapsed">
    <ActionButton label="Infer Properties" action="fixGameObjects" />
    <ActionButton label="Reset Collection" action="resetGameObjects" />
  </Actions>
  <Actions collapseKey="gameObjectsActionsCollapsed">
    <ActionButton label="Export Collections" action="exportGameObjects" />
    <ActionButton label="Export Bundle" action="exportBundle" />
  </Actions>
  {#if $selectionState.layers.length > 1}
    <Actions title="Atlas Actions" collapseKey="layersActionsCollapsed">
      <ActionButton label="Create Atlas" action="createAtlas" />
    </Actions>
  {/if}
</Page>
