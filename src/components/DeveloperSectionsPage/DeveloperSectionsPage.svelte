<script lang="ts">
  import Page from "components/Page";
  import Actions from "components/Actions";
  import ActionButton from "components/ActionButton";
  import ActionOptionButton from "components/ActionOptionButton";
</script>

<Page>
  <Actions title="Tools" collapseKey="sectionsToolsCollapsed">
    <ActionButton label="Fix Atlases" action="fixAtlases" />
    <ActionButton label="Validate Atlases" action="validateAtlases" disabled={true} />
    <ActionButton label="Reset Sections" action="resetSections" />
  </Actions>
  <Actions collapseKey="sectionsToolsCollapsed">
    <ActionButton label="Export Atlases" action="exportAtlases" />
    <ActionOptionButton label="Export Sprites at Scale" value={1} action="exportSprites" />
    <ActionButton label="Destroy Atlases" action="destroyAtlases" />
  </Actions>
</Page>
