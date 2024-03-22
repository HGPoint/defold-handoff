<script lang="ts">
  import { postMessageToPlugin } from "utilities/plugin";
  import Section from "components/Section";
  import Button from "components/Button";

  function onDestroyGUINodes() {
    postMessageToPlugin("destroyGUINodes");
  }
</script>

<Section>
  <Button label="Destroy GUI Nodes Components" onClick={onDestroyGUINodes} />
</Section>
