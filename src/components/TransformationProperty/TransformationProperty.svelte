<script lang="ts">
  import { generateRandomId } from "utilities/ui";

  export let label: string;
  export let value: Vector4;
  export let onUpdate: (value: Vector4) => void;

  const id = generateRandomId();

  function onInput() {
    onUpdate(value);
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
    bind:value={value.x}
    on:input={onInput} />
  <span class="widgetComponentLabel">Y:</span>
  <input
    class="widgetInput"
    type="number"
    bind:value={value.y}
    on:input={onInput} />
  <span class="widgetComponentLabel">Z:</span>
  <input
    class="widgetInput"
    type="number"
    bind:value={value.z}
    on:input={onInput} />
</div>