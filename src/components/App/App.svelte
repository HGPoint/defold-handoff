<script lang="ts">
  import "styles/styles.css";
  import config from "config/config.json";
  import uiState from "state/ui";
  import Controls from "components/Controls";
  import PluginSignals from "components/PluginSignals";
  import Pages from "components/Pages";  

  export let mode: UIMode;

  function initializeUIState() {
    const state = { ...config.ui, mode };
    uiState.set(state);
  }

  initializeUIState();
</script>
{#if $uiState.mode}
  <Controls />
  {#if !$uiState.collapsed}
    <Pages />
  {/if}
{/if}
<PluginSignals />