<script lang="ts">
  import { generateRandomId } from "utilities/pluginUI";

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
<div class="widgetSlice9">
  <span class="widgetComponentLabel">L:</span>
  <input
    class="widgetInput"
    type="number"
    id={id}
    bind:value={editedValue.x}
    {disabled} />
  <span class="widgetComponentLabel">T:</span>
  <input
    class="widgetInput"
    type="number"
    bind:value={editedValue.y}
    {disabled} />
  <span class="widgetComponentLabel">R:</span>
  <input
    class="widgetInput"
    type="number"
    bind:value={editedValue.z}
    {disabled} />
  <span class="widgetComponentLabel">B:</span>
  <input
    class="widgetInput"
    type="number"
    bind:value={editedValue.w}
    {disabled} />
  <button
    class="widgetApply"
    on:click={onApplyClick}>
      Apply
  </button>
</div>