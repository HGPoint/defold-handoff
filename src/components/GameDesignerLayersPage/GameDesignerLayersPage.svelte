<script lang="ts">
  import ActionButton from "components/ActionButton";
  import Actions from "components/Actions";
  import Page from "components/Page";
</script>

<Page>
  <Actions collapseKey="layersActionsCollapsed">
    <ActionButton label="Create Atlas" action="createAtlas" />
    <ActionButton label="Restore Atlases" action="restoreAtlases" />
  </Actions>
</Page>
