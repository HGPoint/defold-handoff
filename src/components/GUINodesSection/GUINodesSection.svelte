<script lang="ts">
  import { postMessageToPlugin } from "utilities/plugin";
  import Section from "components/Section";
  import Button from "components/Button";

  function onDestroyGUINodes() {
    postMessageToPlugin("resetGUINodes");
  }
</script>

<Section>
  <Button label="Reset GUI Nodes" onClick={onDestroyGUINodes} />
</Section>
