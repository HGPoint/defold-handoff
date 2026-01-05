<script lang="ts">
  import NumberInput from "components/NumberInput";
  import Override from "components/Override";
  import { generateRandomId, isValueOverridden } from "utilities/ui";

  export let label: string;
  export let value: number;
  export let disabled = false;
  export let originalValue: WithNull<number> = null;
  export let min: number = 0;

  const id = generateRandomId();

  let editedValue: number = value;

  function onApplyClick() {
    value = editedValue;
  }

  function refreshEditedValue(updatedValue: number) {
    editedValue = updatedValue
  }

  $: refreshEditedValue(value);
</script>

<label
  class="widgetLabel"
  for={id}>
    {label}
</label>
<div
  class="widgetScale"
  class:widgetScale-is-overridden={isValueOverridden(value, originalValue)}>
    <NumberInput
      {id}
      {min}
      {disabled}
      bind:value={value} />
    <button
      class="widgetApply"
      {disabled}
      on:click={onApplyClick}>
        Apply
    </button>
    <Override bind:value={value} {originalValue} />
    <slot />
</div>