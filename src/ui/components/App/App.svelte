<script lang="ts">
  import Sections from "../Sections";
  import PluginSignals from "../PluginSignals";

  let selection: SelectionData;
</script>

<Sections {selection} />
<PluginSignals bind:selection={selection} />