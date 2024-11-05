<script lang="ts">
  import Override from "components/Override";
  import { generateRandomId, isValueOverridden } from "utilities/ui";

  export let label: string;
  export let value: WithNull<boolean>;
  export let originalValue: WithNull<boolean> = null;
  export let disabled: WithNull<boolean> = false;

  const id = generateRandomId();
</script>

<label
  class="widgetLabel"
  class:widgetLabel-is-overridden={isValueOverridden(value, originalValue)}
  for={id}>
    {label}
</label>
<div class="widgetContainer">
  <input
    class="widgetCheckbox"
    class:widgetCheckbox-is-overridden={isValueOverridden(value, originalValue)}
    type="checkbox"
    {id}
    bind:checked={value}
    indeterminate={value === null}
    {disabled} />
  <Override bind:value={value} {originalValue} />
</div>
<slot />