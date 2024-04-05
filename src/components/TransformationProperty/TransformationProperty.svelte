<script lang="ts">
  import { generateRandomId } from "utilities/pluginUI";

  export let label: string;
  export let value: Vector4;
  export let disabled = false;

  const id = generateRandomId();
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
    {disabled} />
  <span class="widgetComponentLabel">Y:</span>
  <input
    class="widgetInput"
    type="number"
    bind:value={value.y}
    {disabled} />
  <span class="widgetComponentLabel">Z:</span>
  <input
    class="widgetInput"
    type="number"
    bind:value={value.z}
    {disabled} />
</div>