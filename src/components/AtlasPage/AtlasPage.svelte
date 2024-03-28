<script lang="ts">
  import Page from "components/Page";
  import Actions from "components/Actions";
  import ActionButton from "components/ActionButton";
</script>

<Page>
  <Actions>
    <ActionButton label="Export Atlas" action="exportAtlases" />
    <ActionButton label="Fix Atlas" action="fixAtlases" disabled={true} />
    <ActionButton label="Validate Atlas" action="validateAtlases" disabled={true} />
    <ActionButton label="Destroy Atlas" action="destroyAtlases" />
  </Actions>
</Page>
