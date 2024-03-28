<script lang="ts">
  import Page from "components/Page";
  import Actions from "components/Actions";
  import ActionButton from "components/ActionButton";
</script>

<Page>
  <Actions>
    <ActionButton label="Copy GUI Node" action="copyGUINodes" />
    <ActionButton label="Export GUI Node" action="exportGUINodes" />
    <ActionButton label="Export GUI Node Bundle" action="exportBundle" />  
    <ActionButton label="Fix GUI Node" action="fixGUINodes" disabled={true} />
    <ActionButton label="Validate GUI Node" action="validateGUINodes" disabled={true} />
    <ActionButton label="Reset GUI Node" action="resetGUINodes" />
  </Actions>
</Page>
