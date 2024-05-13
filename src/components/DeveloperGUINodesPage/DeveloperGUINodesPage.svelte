<script lang="ts">
  import selectionState from "state/selection";
  import Page from "components/Page";
  import Actions from "components/Actions";
  import ActionButton from "components/ActionButton";
</script>

<Page>
  <Actions title="Tools" collapseKey="guiNodesToolsCollapsed">
    <ActionButton label="Infer Properties" action="fixGUINodes" />
    <ActionButton label="Validate GUI" action="validateGUINodes" disabled={true} />
    <ActionButton label="Reset GUI Nodes" action="resetGUINodes" />
  </Actions>
  <Actions collapseKey="guiNodesActionsCollapsed">
    <ActionButton label="Export GUI" action="exportGUINodes" />
    <ActionButton label="Export Bundle" action="exportBundle" />
  </Actions>
  {#if $selectionState.layers.length > 1}
    <Actions title="Atlas Actions" collapseKey="layersActionsCollapsed">
      <ActionButton label="Create Atlas" action="createAtlas" />
    </Actions>
  {/if}
</Page>
