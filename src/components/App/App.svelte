<script lang="ts">
/* global PKG */

  import "styles/styles.css";
  import { resolveVersion } from "utilities/pluginUI";
  import config from "config/config.json";
  import uiState from "state/ui";
  import Controls from "components/Controls";
  import PluginSignals from "components/PluginSignals";
  import Pages from "components/Pages";  

  export let mode: UIMode;
  const version = resolveVersion();

  function initializeUIState() {
    const state = { ...config.ui, mode };
    uiState.set(state);
  }

  initializeUIState();
</script>

{#if $uiState.mode}
  <Controls {version} />
  {#if !$uiState.collapsed}
    <Pages />
  {/if}
{/if}
<PluginSignals />