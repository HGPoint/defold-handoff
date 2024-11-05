<script lang="ts" generics="T extends PluginGUINodeData[keyof PluginGUINodeData]">
  import Override from "components/Override";
  import { generateRandomId, isValueOverridden } from "utilities/ui";

  export let label: string;
  export let value: T;
  export let options: Record<string, T>;
  export let originalValue: WithNull<T> = null;
  export let disabled = false;

  const id = generateRandomId();
</script>

<label
  class="widgetLabel"
  class:widgetLabel-is-overridden={isValueOverridden(value, originalValue)}
  for={id}>
    {label}
</label>
<div class="widgetContainer">
  <select
    class="widgetSelect"
    class:widgetSelect-is-overridden={isValueOverridden(value, originalValue)}
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