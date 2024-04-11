<script lang="ts">
  import { vector4 } from "utilities/math";
  import { generateRandomId } from "utilities/pluginUI";

  export let value: Vector4;
  export let size: Vector4;
  export let label: string;
  export let disabled = false;

  let editedValue = { ...value };
  let borderTransforms = vector4(0);

  const id = generateRandomId();

  function onApplyClick() {
    value = { ...editedValue };
  }

  function updateBorderTransforms(updatedValue: Vector4) {
    const width = 279;
    const height = width * (size.y / size.x);
    const { x, y, z, w } = updatedValue;
    const transformX = width * (x / size.x);
    const transformY = height * (y / size.y);
    const transformZ = -width * (z / size.x);
    const transformW = -height * (w / size.y);
    borderTransforms = vector4(transformX, transformY, transformZ, transformW);
  }

  $: updateBorderTransforms(editedValue);
</script>

<div class="slice9Editor">
  <label
    class="widgetLabel"
    for={id}>
      Slice 9
  </label>
  <input
    id={id}
    class="slice9Input"
    type="number"
    min="0"
    max={size.x}
    bind:value={editedValue.x}
  {disabled} />
  <input
    class="slice9Input"
    type="number"
    min="0"
    max={size.y}
    bind:value={editedValue.y}
    {disabled} />
  <input
    class="slice9Input"
    type="number"
    min="0"
    max={size.x}
    bind:value={editedValue.z}
    {disabled} />
  <input
    class="slice9Input"
    type="number"
    min="0"
    max={size.y}
    bind:value={editedValue.w}
    {disabled} />
  <div class="slice9ImageHolder">
    <div
      class="slice9borderTop"
      style:transform={`translateY(${borderTransforms.y}px)`}></div>
    <div
      class="slice9borderLeft"
      style:transform={`translateX(${borderTransforms.x}px)`}></div>
    <div
      class="slice9borderBottom"
      style:transform={`translateY(${borderTransforms.w}px)`}></div>
    <div
      class="slice9borderRight"
      style:transform={`translateX(${borderTransforms.z}px)`}></div>
    <img
      width={size.x}
      height={size.y}
      src="#"
      class="slice9Image"
      alt={label} />
  </div>
  <button
    class="widgetApply"
    on:click={onApplyClick}>
      Apply
  </button>
</div>