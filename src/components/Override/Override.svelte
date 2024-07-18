<script lang="ts" generics="T extends PluginGUINodeData[keyof PluginGUINodeData]">
  import { isOverride, renderValue } from "utilities/pluginUI";
  
  export let value: T;
  export let originalValue: T | null;

  function restoreValue() {
    if (originalValue !== null) {
      value = originalValue;
    }
  }
</script>

{#if isOverride(value, originalValue)}
  <button
    class="restoreButton"
    on:click={restoreValue}>
      Restore
  </button>
  <span class="originalValue">
    {originalValue}
  </span>
{/if}