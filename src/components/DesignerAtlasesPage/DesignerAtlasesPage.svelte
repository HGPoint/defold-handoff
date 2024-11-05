<script lang="ts">
  import ActionButton from "components/ActionButton";
  import Actions from "components/Actions";
  import Page from "components/Page";
</script>

<Page>
  <Actions title="Tools" collapseKey="atlasesActionsCollapsed">
    <ActionButton label="Fix Atlases" action="fixAtlases" />
    <ActionButton label="Sort Atlases" action="sortAtlases" />
    <ActionButton label="Fit Atlases" action="fitAtlases" />
  </Actions>
</Page>
