<script lang="ts">
  import { generateRandomId } from "utilities/pluginUI";
  import NumberInput from "components/NumberInput";
  
  export let label: string;
  export let value: Vector4;
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
  for={id}>
    {label}
</label>
<div class="widgetTransformation">
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
</div>