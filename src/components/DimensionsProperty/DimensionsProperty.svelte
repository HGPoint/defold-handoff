<script lang="ts">
  import { generateRandomId } from "utilities/pluginUI";
  import NumberInput from "components/NumberInput";

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
  <NumberInput
    {id}
    bind:value={value.x}
    {disabled} />
  <span class="widgetComponentLabel">H:</span>
  <NumberInput
    bind:value={value.y}
    {disabled} />
</div>