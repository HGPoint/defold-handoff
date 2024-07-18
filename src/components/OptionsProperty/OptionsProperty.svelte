<script lang="ts" generics="T extends PluginGUINodeData[keyof PluginGUINodeData]">
  import { generateRandomId, isOverride } from "utilities/pluginUI";
  import Override from "components/Override";

  export let label: string;
  export let value: T;
  export let options: Record<string, T>;
  export let originalValue: T | null = null;
  export let disabled = false;

  const id = generateRandomId();
</script>

<label
  class="widgetLabel"
  class:widgetLabel-is-overridden={isOverride(value, originalValue)}
  for={id}>
    {label}
</label>
<div class="widgetContainer">
  <select
    class="widgetSelect"
    class:widgetSelect-is-overridden={isOverride(value, originalValue)}
    {id}
    bind:value
    {disabled}>
      {#each Object.keys(options) as key}
      <option value={options[key]}>{key}</option>
      {/each}
  </select>
  <Override bind:value={value} {originalValue} />
</div>
<slot />