<script lang="ts">
  import ActionButton from "components/ActionButton";
  import ActionOptionButton from "components/ActionOptionButton";
  import Actions from "components/Actions";
  import Page from "components/Page";
</script>

<Page>
  <Actions title="Tools" collapseKey="sectionsToolsCollapsed">
    <ActionButton label="Fix Atlases" action="fixAtlases" />
    <ActionButton label="Validate Atlases" action="validateAtlases" disabled={true} />
    <ActionButton label="Reset Sections" action="removeSections" />
  </Actions>
  <Actions collapseKey="sectionsToolsCollapsed">
    <ActionButton label="Export Atlases" action="exportAtlases" />
    <ActionOptionButton label="Export Sprites at Scale" value={1} action="exportSprites" />
    <ActionButton label="Destroy Atlases" action="removeAtlases" />
  </Actions>
</Page>
