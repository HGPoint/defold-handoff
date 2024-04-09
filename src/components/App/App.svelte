<script lang="ts">
  import "styles/styles.css";
  import config from "config/config.json";
  import uiState from "state/ui";
  import Controls from "components/Controls";
  import Sections from "components/Pages";
  import PluginSignals from "components/PluginSignals";

  function initializeUIState() {
    const state = { ...config.ui };
    uiState.set(state);
  }

  initializeUIState();
</script>
<Controls />
{#if !$uiState.collapsed}
  <Sections />
{/if}
<PluginSignals />