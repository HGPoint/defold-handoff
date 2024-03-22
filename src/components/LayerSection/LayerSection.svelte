<script lang="ts">
  import Section from "components/Section";
  import ActionButton from "components/ActionButton";
</script>

<Section>
  <div class="actions">
    <ActionButton label="Copy GUI Node" action="copyGUINodes" />
    <ActionButton label="Export GUI Node" action="exportGUINodes" />
    <ActionButton label="Export GUI Node Bundle" action="exportBundle" />  
    <ActionButton label="Fix GUI Node" action="fixGUINodes" disabled={true} />
    <ActionButton label="Validate GUI Node" action="validateGUINodes" disabled={true} />
    <ActionButton label="Reset GUI Node" action="resetGUINodes" />
  </div>
</Section>
