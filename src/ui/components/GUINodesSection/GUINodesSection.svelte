<script lang="ts">
  import { postMessageToPlugin } from '../../../utilities/plugin';
  import Section from '../Section';
  import Button from '../Button';

  function onDestroyGUINodes() {
    postMessageToPlugin("destroyGUINodes");
  }
</script>

<Section>
  <Button label="Destroy GUI Nodes Components" onClick={onDestroyGUINodes} />
</Section>
