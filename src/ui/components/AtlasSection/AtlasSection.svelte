<script lang="ts">
  import { postMessageToPlugin } from '../../../utilities/plugin';
  import Section from '../Section';
  import Button from '../Button';

  function onExportAtlas() {
    postMessageToPlugin("exportAtlases");
  }

  function onDestroyAtlas() {
    postMessageToPlugin("destroyAtlases");
  }
</script>

<Section>
  <Button label="Export Atlas" onClick={onExportAtlas} />
  <Button label="Destroy Atlas" onClick={onDestroyAtlas} />
</Section>
