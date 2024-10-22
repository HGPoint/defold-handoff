<script lang="ts">
  import Page from "components/Page";
  import Actions from "components/Actions";
  import ActionButton from "components/ActionButton";
</script>

<Page>
  <Actions title="Tools" collapseKey="atlasesActionsCollapsed">
    <ActionButton label="Fix Atlases" action="fixAtlases" />
    <ActionButton label="Sort Atlases" action="sortAtlases" />
    <ActionButton label="Fit Atlases" action="fitAtlases" />
  </Actions>
</Page>
