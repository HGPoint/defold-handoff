<script lang="ts">
  import NumberInput from "components/NumberInput";
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
<div class="widgetDimensions">
  <span class="widgetComponentLabel">W:</span>
  <NumberInput
    {id}
    min={0}
    bind:value={value.x}
    {disabled} />
  <span class="widgetComponentLabel">H:</span>
  <NumberInput
    min={0}
    bind:value={value.y}
    {disabled} />
</div>