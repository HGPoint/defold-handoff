<script lang="ts">
  import { postMessageToPlugin } from "utilities/plugin";
  import Section from "components/Section";
  import Button from "components/Button";

  function onCreateAtlas() {
    postMessageToPlugin("createAtlas");
  }
</script>

<Section>
  <Button label="Create Atlas" onClick={onCreateAtlas} />
</Section>
