<script lang="ts">
  import ActionButton from "components/ActionButton";
  import Actions from "components/Actions";
  import Page from "components/Page";
</script>

<Page>
  <Actions title="Tools" collapseKey="atlasesActionsCollapsed">
    <ActionButton label="Fix Atlases" action="fixAtlases" />
    <ActionButton label="Sort Atlases Alphabetically" action="sortAtlasesAlphabet" />
    <ActionButton label="Sort Atlases By Size" action="sortAtlasesSize" />
    <ActionButton label="Fit Atlases" action="fitAtlases" />
  </Actions>
  <Actions collapseKey="atlasesToolsCollapsed">
    <ActionButton label="Export Atlases" action="exportAtlases" />
  </Actions>
</Page>
