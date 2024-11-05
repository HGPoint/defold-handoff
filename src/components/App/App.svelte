<script lang="ts">
/* global PKG */

  import Controls from "components/Controls";
  import Pages from "components/Pages";
  import PluginSignals from "components/PluginSignals";
  import config from "config/config.json";
  import selectionState from "state/selection";
  import uiState from "state/ui";
  import "styles/styles.css";
  import { resolvePluginVersion } from "utilities/ui";

  export let mode: UIMode;
  const version = resolvePluginVersion();

  function initializeUIState() {
    const state = { ...config.ui, mode };
    uiState.set(state);
  }

  function resetScroll($selectionState: SelectionUIData) {
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  initializeUIState();

  $: resetScroll($selectionState);
</script>

{#if $uiState.mode}
  <Controls {version} />
  {#if !$uiState.collapsed}
    <Pages />
  {/if}
{/if}
<PluginSignals />