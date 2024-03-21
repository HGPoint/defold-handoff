<script lang="ts">
  import { postMessageToPlugin } from '../../../utilities/plugin';
  import Section from '../Section';
  import Button from '../Button';
  
  function onCreateGUINode() {
    postMessageToPlugin("createGUINode");
  }

  function onCopyGUINode() {
    postMessageToPlugin("copyGUINodes");
  }

  function onExportGUINode() {
    postMessageToPlugin("exportGUINodes");
  }
</script>

<Section>
  <Button label="Create GUI Node" onClick={onCreateGUINode} />
  <Button label="Copy GUI Node" onClick={onCopyGUINode} />
  <Button label="Export GUI Node" onClick={onExportGUINode} />
</Section>
