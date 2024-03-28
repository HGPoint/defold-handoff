<script lang="ts">
  import Page from "components/Page";
  import Actions from "components/Actions";
  import ActionButton from "components/ActionButton";
</script>

<Page>
  <Actions>
    <ActionButton label="Export Atlases" action="exportAtlases" />
    <ActionButton label="Fix Atlases" action="fixAtlases" disabled={true} />
    <ActionButton label="Validate Atlases" action="validateAtlases" disabled={true} />
    <ActionButton label="Destroy Atlases" action="destroyAtlases" />
  </Actions>
</Page>
