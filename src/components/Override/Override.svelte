<script lang="ts" generics="T extends PluginGUINodeData[keyof PluginGUINodeData]">
  import { isValueOverridden } from "utilities/ui";
  
  export let value: WithNull<T>;
  export let originalValue: WithNull<T>;

  function restoreValue() {
    if (originalValue !== null) {
      value = originalValue;
    }
  }
</script>

{#if isValueOverridden(value, originalValue)}
  <button
    class="restoreButton"
    on:click={restoreValue}>
      Restore
  </button>
  <span class="originalValue">
    {originalValue}
  </span>
{/if}