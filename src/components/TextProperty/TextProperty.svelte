<script lang="ts">
  import Override from "components/Override";
  import { generateRandomId, isValueOverridden } from "utilities/ui";

  export let label: string;
  export let value: string;
  export let originalValue: WithNull<string> = null;
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
  <input
    class="widgetInput"
    class:widgetInput-is-overridden={isValueOverridden(value, originalValue)}
    type="text"
    {id}
    bind:value
    {disabled} />
  <Override bind:value={value} {originalValue} />
</div>
<slot />