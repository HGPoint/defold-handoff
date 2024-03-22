<script lang="ts">
  import { postMessageToPlugin } from "utilities/plugin";
  import Section from "components/Section";
  import Button from "components/Button";

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
