<script lang="ts">
  import Sections from "components/Sections";
  import PluginSignals from "components/PluginSignals";

  let selection: SelectionData;
</script>

<Sections {selection} />
<PluginSignals bind:selection={selection} />