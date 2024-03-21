<script lang="ts">
  import { postMessageToPlugin } from '../../../utilities/plugin';
  import Section from '../Section';
  import Button from '../Button';

  function onExportAtlases() {
    postMessageToPlugin("exportAtlases");
  }
  
  function onDestroyAtlases() {
    postMessageToPlugin("destroyAtlases");
  }
</script>

<Section>
  <Button label="Export Atlases" onClick={onExportAtlases} />
  <Button label="Destroy Atlases" onClick={onDestroyAtlases} />
</Section>
