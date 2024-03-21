<script lang="ts">
  import { postMessageToPlugin } from '../../../utilities/plugin';
  import Section from '../Section';
  import Button from '../Button';

  function onCreateAtlas() {
    postMessageToPlugin("createAtlas");
  }
</script>

<Section>
  <Button label="Create Atlas" onClick={onCreateAtlas} />
</Section>
