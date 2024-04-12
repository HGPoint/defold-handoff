<script lang="ts">
  import uiState from "state/ui"
  import { postMessageToPlugin } from "utilities/pluginUI"; 

  let title: string;

  function onCollapseClick() {
    $uiState.collapsed = !$uiState.collapsed;
  }

  function updateUI(state: UIData) {
    const { collapsed } = $uiState;
    const message = collapsed ? "collapseUI" : "expandUI";
    title = collapsed ? "Expand" : "Collapse";
    postMessageToPlugin(message);
  }

  $: updateUI($uiState);
</script>

<div class="controls">
  <button
    class="controlToggle"
    on:click={onCollapseClick}>
      {title}
  </button>
</div>