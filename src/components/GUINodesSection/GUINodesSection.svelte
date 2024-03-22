<script lang="ts">
  import Section from "components/Section";
  import ActionButton from "components/ActionButton";
</script>

<Section>
  <div class="actions">
    <ActionButton label="Export GUI Nodes" action="exportGUINodes" />
    <ActionButton label="Export GUI Nodes Bundle" action="exportBundle" />
    <ActionButton label="Fix GUI Nodes" action="fixGUINodes" disabled={true} />
    <ActionButton label="Validate GUI Nodes" action="validateGUINodes" disabled={true} />
    <ActionButton label="Reset GUI Nodes" action="resetGUINodes" />
  </div>
</Section>
