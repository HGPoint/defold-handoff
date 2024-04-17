<script lang="ts">
  import imageState from "state/image";
  import { vector4 } from "utilities/math";
  import { generateRandomId } from "utilities/pluginUI";

  export let value: Vector4;
  export let label: string;
  export let disabled = false;

  let editedValue: Vector4 = { ...value }
  let image: string;
  let size: Vector4 = vector4(0);
  let borderTransforms: Vector4 = vector4(0);

  const id = generateRandomId();

  function onApplyClick() {
    value = { ...editedValue };
  }

  function onHorizontalClick() {
    const halfPosition = Math.floor(size.x / 2) - 1;
    editedValue = vector4(halfPosition, 0, halfPosition, 0);
  }

  function onVerticalClick() {
    const halfPosition = Math.floor(size.y / 2) - 1;
    editedValue = vector4(0, halfPosition, 0, halfPosition);
  }

  function on4WayClick() {
    const halfPositionX = Math.floor(size.x / 2) - 1;
    const halfPositionY = Math.floor(size.y / 2) - 1;
    editedValue = vector4(halfPositionX, halfPositionY, halfPositionX, halfPositionY);
  }

  function onResetClick() {
    editedValue = vector4(0);
  }

  function refreshEditedValue(updatedValue: Vector4) {
    editedValue = { ...value };
  }

  function updateBorderTransforms(updatedValue: Vector4, updatedSize: Vector4) {
    const width = 279;
    const height = width * (size.y / size.x);
    const { x, y, z, w } = editedValue;
    const transformX = width * (x / size.x);
    const transformY = height * (y / size.y);
    const transformZ = -width * (z / size.x);
    const transformW = -height * (w / size.y);
    borderTransforms = vector4(transformX, transformY, transformZ, transformW);
  }

  function updateImage(data: Uint8Array | null) {
    if (data) {
      function onLoad() {
        size = vector4(img.width, img.height, 0, 0);
        image = url;
        img.removeEventListener('load', onLoad);
      }
      const blob = new Blob([data], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      var img = new Image();
      img.addEventListener('load', onLoad);
      img.src = url;
    } else {
      image = "";
    }
  }

  $: refreshEditedValue(value);
  $: updateImage($imageState);
  $: updateBorderTransforms(editedValue, size);
</script>

<div class="slice9Editor">
  <label
    class="widgetLabel"
    for={id}>
      Slice 9
  </label>
  {#if image}
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
          src={image}
          class="slice9Image"
          alt={label} />
    </div>
    <div class="slice9Size">
      {`Size: ${size.x}×${size.y}`}
    </div>
    <div class="slice9Tools">
      <button
        {disabled}
        on:click={onHorizontalClick}>
          Horizontal Stretch
      </button>
      <button
        {disabled}
        on:click={onVerticalClick}>
          Vertical Stretch
      </button>
      <button
        {disabled}
        on:click={on4WayClick}>
          4-Way Stretch
      </button>
      <button
        {disabled}
        on:click={onResetClick}>
          Reset
      </button>
    </div>
    <button
      class="widgetApply"
      on:click={onApplyClick}>
        Apply
    </button>
  {:else}
    <div class="slice9Empty">No texture...</div>
  {/if}
</div>