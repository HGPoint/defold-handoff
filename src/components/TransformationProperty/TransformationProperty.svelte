<script lang="ts">
  import NumberInput from "components/NumberInput";
  import Override from "components/Override";
  import { generateRandomId, isValueOverridden } from "utilities/ui";
  
  export let label: string;
  export let value: Vector4;
  export let originalValue: WithNull<Vector4> = null;
  export let disabled = false;

  const id = generateRandomId();

  let editedValue: Vector4 = { ...value };

  function onApplyClick() {
    value = { ...editedValue };
  }

  function refreshEditedValue(updatedValue: Vector4) {
    editedValue = { ...updatedValue }
  }

  $: refreshEditedValue(value);
</script>

<label
  class="widgetLabel"
  class:widgetLabel-is-overridden={isValueOverridden(value, originalValue)}
  for={id}>
    {label}
</label>
<div
  class="widgetTransformation"
  class:widgetTransformation-is-overridden={isValueOverridden(value, originalValue)}>
    <span class="widgetComponentLabel">X:</span>
    <NumberInput
      {id}
      bind:value={editedValue.x}
      {disabled} />
    <span class="widgetComponentLabel">Y:</span>
    <NumberInput
      bind:value={editedValue.y}
      {disabled} />
    <span class="widgetComponentLabel">Z:</span>
    <NumberInput
      bind:value={editedValue.z}
      {disabled} />
    <button
      class="widgetApply"
      {disabled}
      on:click={onApplyClick}>
        Apply
    </button>
    <Override bind:value={value} {originalValue} />
</div>
<slot />