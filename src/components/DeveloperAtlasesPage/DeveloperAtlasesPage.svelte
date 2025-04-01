<script lang="ts">
  import ActionButton from "components/ActionButton";
  import ActionOptionButton from "components/ActionOptionButton";
  import Actions from "components/Actions";
  import Page from "components/Page";
</script>

<Page>
  <Actions title="Tools" collapseKey="atlasesActionsCollapsed">
    <ActionButton label="Fix Atlases" action="fixAtlases" />
    <ActionButton label="Sort Atlases Alphabetically" action="sortAtlasesAlphabet" />
    <ActionButton label="Sort Atlases By Size" action="sortAtlasesSize" />
    <ActionButton label="Fit Atlases" action="fitAtlases" />
    <ActionButton label="Validate Atlases" action="validateAtlases" disabled={true} />
  </Actions>
  <Actions collapseKey="atlasesToolsCollapsed">
    <ActionButton label="Export Atlases" action="exportAtlases" />
    <ActionOptionButton label="Export Sprites at Scale" value={1} action="exportSprites" />
    <ActionButton label="Destroy Atlases" action="removeAtlases" />
  </Actions>
</Page>
