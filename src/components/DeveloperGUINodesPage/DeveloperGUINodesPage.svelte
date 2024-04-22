<script lang="ts">
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
</Page>
