<script lang="ts">
  import Page from "components/Page";
  import Actions from "components/Actions";
  import ActionButton from "components/ActionButton";
  import ActionOptionButton from "components/ActionOptionButton";
</script>

<Page>
  <Actions title="Tools" collapseKey="atlasesActionsCollapsed">
    <ActionButton label="Fix Atlases" action="fixAtlases" />
    <ActionButton label="Sort Atlases" action="sortAtlases" />
    <ActionButton label="Fit Atlases" action="fitAtlases" />
    <ActionButton label="Validate Atlases" action="validateAtlases" disabled={true} />
  </Actions>
  <Actions collapseKey="atlasesToolsCollapsed">
    <ActionButton label="Export Atlases" action="exportAtlases" />
    <ActionOptionButton label="Export Sprites at Scale" value={1} action="exportSprites" />
    <ActionButton label="Destroy Atlases" action="destroyAtlases" />
  </Actions>
</Page>
