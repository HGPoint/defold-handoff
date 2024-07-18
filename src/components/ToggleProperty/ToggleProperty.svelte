<script lang="ts">
  import { generateRandomId, isOverride } from "utilities/pluginUI";
  import Override from "components/Override";

  export let label: string;
  export let value: boolean;
  export let originalValue: boolean | null = null;
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
    class="widgetCheckbox"
    class:widgetCheckbox-is-overridden={isOverride(value, originalValue)}
    type="checkbox"
    {id}
    bind:checked={value}
    {disabled} />
  <Override bind:value={value} {originalValue} />
</div>
<slot />