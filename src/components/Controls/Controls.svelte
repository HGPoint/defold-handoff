<script lang="ts">
  import uiState from "state/ui"
  import { postMessageToPlugin } from "utilities/pluginUI"; 

  let title: string;
  let lastSentUpdate = $uiState.collapsed;

  function shouldUpdate() {
    if ($uiState.collapsed !== lastSentUpdate) {
      lastSentUpdate = $uiState.collapsed;
      return true;
    }
    return false;
  }

  function updateTitle(collapsed: boolean) {
    title = collapsed ? "Expand" : "Collapse";
  }

  function updatePlugin(collapsed: boolean) {
    const message = collapsed ? "collapseUI" : "expandUI";
    postMessageToPlugin(message);
  }

  function update(state: UIData) {
    if (shouldUpdate()) {
      const { collapsed } = $uiState;
      updateTitle(collapsed);
      updatePlugin(collapsed);
    }
  }

  function onCollapseClick() {
    $uiState.collapsed = !$uiState.collapsed;
  }

  updateTitle($uiState.collapsed);

  $: update($uiState);
</script>

<div class="controls">
  <button
    class="controlToggle"
    on:click={onCollapseClick}>
      {title}
  </button>
</div>