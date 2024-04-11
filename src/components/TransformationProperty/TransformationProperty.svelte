<script lang="ts">
  import { generateRandomId } from "utilities/pluginUI";

  export let label: string;
  export let value: Vector4;
  export let disabled = false;

    let editedValue = { ...value };

  const id = generateRandomId();

  function onApplyClick() {
    value = { ...editedValue };
  }
</script>

<label
  class="widgetLabel"
  for={id}>
    {label}
</label>
<div class="widgetTransformation">
  <span class="widgetComponentLabel">X:</span>
  <input
    class="widgetInput"
    type="number"
    id={id}
    bind:value={editedValue.x}
    {disabled} />
  <span class="widgetComponentLabel">Y:</span>
  <input
    class="widgetInput"
    type="number"
    bind:value={editedValue.y}
    {disabled} />
  <span class="widgetComponentLabel">Z:</span>
  <input
    class="widgetInput"
    type="number"
    bind:value={editedValue.z}
    {disabled} />
  <button
    class="widgetApply"
    on:click={onApplyClick}>
      Apply
  </button>
</div>