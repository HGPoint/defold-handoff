<script lang="ts">
  import Page from "components/Page";
  import Actions from "components/Actions";
  import ActionButton from "components/ActionButton";
</script>

<Page>
  <Actions collapseKey="layersActionsCollapsed">
    <ActionButton label="Create Atlas" action="createAtlas" />
    <ActionButton label="Restore Atlases" action="restoreAtlases" />
  </Actions>
</Page>
