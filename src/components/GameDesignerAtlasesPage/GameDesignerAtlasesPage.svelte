<script lang="ts">
  import ActionButton from "components/ActionButton";
  import Actions from "components/Actions";
  import Page from "components/Page";
</script>

<Page>
  <Actions title="Tools" collapseKey="atlasesActionsCollapsed">
    <ActionButton label="Fix Atlases" action="fixAtlases" />
    <ActionButton label="Sort Atlas Alphabetically" action="sortAtlasesAlphabet" />
    <ActionButton label="Sort Atlas By Size" action="sortAtlasesSize" />
    <ActionButton label="Fit Atlas" action="fitAtlases" />
    <ActionButton label="Copy Atlas" action="copyAtlases" />
  </Actions>
  <Actions collapseKey="atlasesToolsCollapsed">
    <ActionButton label="Export Atlases" action="exportAtlases" />
  </Actions>
</Page>
