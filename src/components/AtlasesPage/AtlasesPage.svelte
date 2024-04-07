<script lang="ts">
  import Page from "components/Page";
  import Actions from "components/Actions";
  import ActionButton from "components/ActionButton";
</script>

<Page>
  <Actions title="Tools">
    <ActionButton label="Fix Atlases" action="fixAtlases" disabled={true} />
    <ActionButton label="Validate Atlases" action="validateAtlases" disabled={true} />
  </Actions>
  <Actions>
    <ActionButton label="Export Atlases" action="exportAtlases" />
    <ActionButton label="Destroy Atlases" action="destroyAtlases" />
  </Actions>
</Page>
