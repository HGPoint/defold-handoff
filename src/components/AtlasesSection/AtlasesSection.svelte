<script lang="ts">
  import Section from "components/Section";
  import ActionButton from "components/ActionButton";
</script>

<Section>
  <div class="actions">
    <ActionButton label="Export Atlases" action="exportAtlases" />
    <ActionButton label="Fix Atlases" action="fixAtlases" disabled={true} />
    <ActionButton label="Validate Atlases" action="validateAtlases" disabled={true} />
    <ActionButton label="Destroy Atlases" action="destroyAtlases" />
  </div>
</Section>
