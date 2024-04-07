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
<div class="widgetDimensions">
  <span class="widgetComponentLabel">W:</span>
  <input
    class="widgetInput"
    type="number"
    id={id}
    bind:value={value.x}
    {disabled} />
  <span class="widgetComponentLabel">H:</span>
  <input
    class="widgetInput"
    type="number"
    bind:value={value.y}
    {disabled} />
</div>