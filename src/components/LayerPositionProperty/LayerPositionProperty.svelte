<script lang="ts">
  import NumberInput from "components/NumberInput";
  import Override from "components/Override";
  import { generateRandomId, isValueOverridden } from "utilities/ui";
  
  export let label: string;
  export let value: Vector4;
  export let min: number = Number.MIN_SAFE_INTEGER;
  export let max: number = Number.MAX_SAFE_INTEGER;
  export let originalValue: WithNull<Vector4> = null;
  export let disabled = false;

  const id = generateRandomId();
</script>

<label
  class="widgetLabel"
  class:widgetLabel-is-overridden={isValueOverridden(value, originalValue)}
  for={id}>
    {label}
</label>
<div
  class="widgetLayerPosition"
  class:widgetTransformation-is-overridden={isValueOverridden(value, originalValue)}>
    <span class="widgetComponentLabel">X:</span>
    <NumberInput
      {id}
      bind:value={value.x}
      {min}
      {max}
      disabled={true} />
    <span class="widgetComponentLabel">Y:</span>
    <NumberInput
      bind:value={value.y}
      {min}
      {max}
      disabled={true} />
    <span class="widgetComponentLabel">Z:</span>
    <NumberInput
      bind:value={value.z}
      {min}
      {max}
      {disabled} />
    <Override bind:value={value} {originalValue} />
</div>
<slot />