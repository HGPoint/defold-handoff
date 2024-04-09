<script lang="ts">
  import uiState from "state/ui"
  import { postMessageToPlugin } from "utilities/pluginUI"; 

  $: collapseTitle = $uiState.collapsed ? "Show" : "Hide";
  $: updateUI($uiState.collapsed);

  function onCollapseClick() {
    $uiState.collapsed = !$uiState.collapsed;
  }

  function updateUI(collapsed: boolean) {
    const message = collapsed ? "collapseUI" : "expandUI";
    postMessageToPlugin(message);
  }
</script>

<div class="controls">
  <button
    class="controlToggle"
    on:click={onCollapseClick}>
      {collapseTitle}
  </button>
</div>