<script lang="ts">
  import { postMessageToPlugin } from "utilities/plugin";
  import Section from "components/Section";
  import Button from "components/Button";

  function onCopyGUINode() {
    postMessageToPlugin("copyGUINodes");
  }

  function onExportGUINode() {
    postMessageToPlugin("exportGUINodes");
  }
</script>

<Section>
  <Button label="Copy GUI Node" onClick={onCopyGUINode} />
  <Button label="Export GUI Node" onClick={onExportGUINode} />
</Section>
