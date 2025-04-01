<script lang="ts">
  import NumberInput from "components/NumberInput";
  import Override from "components/Override";
  import { generateRandomId, isValueOverridden } from "utilities/ui";

  export let label: string;
  export let value: Vector4 | undefined = { x: 0, y: 0, z: 0, w: 0 };
  export let originalValue: WithNull<Vector4> = null;
  export let disabled = false;

  const id = generateRandomId();
  
  let editedValue: Vector4 = value ? { ...value } : { x: 0, y: 0, z: 0, w: 0 };
  
  function onApplyClick() {
    value = { ...editedValue };
  }

  function refreshEditedValue(updatedValue: Vector4) {
    editedValue = { ...updatedValue }
  }

  $: refreshEditedValue(value || { x: 0, y: 0, z: 0, w: 0 });
</script>

<label
  class="widgetLabel"
  class:widgetLabel-is-overridden={isValueOverridden(value, originalValue)}
  for={id}>
    {label}
</label>
<div
  class="widgetSlice9"
  class:widgetSlice9-is-overridden={isValueOverridden(value, originalValue)}>
    <span class="widgetComponentLabel">L:</span>
    <NumberInput
      {id}
      min={0}
      bind:value={editedValue.x}
      {disabled} />
    <span class="widgetComponentLabel">T:</span>
    <NumberInput
      min={0}  
      bind:value={editedValue.y}
      {disabled} />
    <span class="widgetComponentLabel">R:</span>
    <NumberInput
      min={0}  
      bind:value={editedValue.z}
      {disabled} />
    <span class="widgetComponentLabel">B:</span>
    <NumberInput
      min={0}  
      bind:value={editedValue.w}
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