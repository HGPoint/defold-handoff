<script lang="ts">
  import { generateRandomId, isOverride } from "utilities/pluginUI";
  import Override from "components/Override";

  export let label: string;
  export let value: string;
  export let originalValue: string | null = null;
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
  <input
    class="widgetInput"
    class:widgetInput-is-overridden={isOverride(value, originalValue)}
    type="text"
    {id}
    bind:value
    {disabled} />
  <Override bind:value={value} {originalValue} />
</div>
<slot />