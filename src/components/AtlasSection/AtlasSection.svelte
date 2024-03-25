<script lang="ts">
  import Section from "components/Section";
  import Actions from "components/Actions";
  import ActionButton from "components/ActionButton";
</script>

<Section>
  <Actions>
    <ActionButton label="Export Atlas" action="exportAtlases" />
    <ActionButton label="Fix Atlas" action="fixAtlases" disabled={true} />
    <ActionButton label="Validate Atlas" action="validateAtlases" disabled={true} />
    <ActionButton label="Destroy Atlas" action="destroyAtlases" />
  </Actions>
</Section>
