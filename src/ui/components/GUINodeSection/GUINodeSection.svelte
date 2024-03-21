<script lang="ts">
  import { postMessageToPlugin } from '../../../utilities/plugin';
  import Section from '../Section';
  import Button from '../Button';

  function onCopyGUINode() {
    postMessageToPlugin("copyGUINodes");
  }

  function onExportGUINode() {
    postMessageToPlugin("exportGUINodes");
  }

  function onExportGUINodeBundle() {
    postMessageToPlugin("exportBundle");
  }

  function onDestroyGUINode() {
    postMessageToPlugin("destroyGUINodes");
  }
</script>

<Section>
  <Button label="Copy GUI Node" onClick={onCopyGUINode} />
  <Button label="Export GUI Node" onClick={onExportGUINode} />
  <Button label="Export GUI Node Bundle" onClick={onExportGUINodeBundle} />
  <Button label="Destroy GUI Node" onClick={onDestroyGUINode} />
</Section>
