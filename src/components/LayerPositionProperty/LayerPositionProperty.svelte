<script lang="ts">
  import { generateRandomId, isOverride } from "utilities/pluginUI";
  import NumberInput from "components/NumberInput";
  import Override from "components/Override";
  
  export let label: string;
  export let value: Vector4;
  export let originalValue: Vector4 | null = null;
  export let disabled = false;

  const id = generateRandomId();
</script>

<label
  class="widgetLabel"
  class:widgetLabel-is-overridden={isOverride(value, originalValue)}
  for={id}>
    {label}
</label>
<div
  class="widgetLayerPosition"
  class:widgetTransformation-is-overridden={isOverride(value, originalValue)}>
    <span class="widgetComponentLabel">X:</span>
    <NumberInput
      {id}
      bind:value={value.x}
      disabled={true} />
    <span class="widgetComponentLabel">Y:</span>
    <NumberInput
      bind:value={value.y}
      disabled={true} />
    <span class="widgetComponentLabel">Z:</span>
    <NumberInput
      bind:value={value.z}
      {disabled} />
    <Override bind:value={value} {originalValue} />
</div>
<slot />