<script lang="ts">
  import "styles/styles.css";
  import Sections from "components/Sections";
  import PluginSignals from "components/PluginSignals";

  let selection: SelectionUIData;
</script>

<Sections {selection} />
<PluginSignals bind:selection={selection} />