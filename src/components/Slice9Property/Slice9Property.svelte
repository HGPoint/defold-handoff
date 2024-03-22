<script lang="ts">
  import { generateRandomId } from "utilities/ui";

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
<div class="widgetSlice9">
  <span class="widgetComponentLabel">L:</span>
  <input
    class="widgetInput"
    type="number"
    id={id}
    bind:value={value.x}
    {disabled} />
  <span class="widgetComponentLabel">T:</span>
  <input
    class="widgetInput"
    type="number"
    bind:value={value.y}
    {disabled} />
  <span class="widgetComponentLabel">R:</span>
  <input
    class="widgetInput"
    type="number"
    bind:value={value.z}
    {disabled} />
  <span class="widgetComponentLabel">B:</span>
  <input
    class="widgetInput"
    type="number"
    bind:value={value.w}
    {disabled} />
</div>