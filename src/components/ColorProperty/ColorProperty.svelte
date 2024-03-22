<script lang="ts">
  import { generateRandomId } from "utilities/ui";
  import { convertHexToRGBA } from "utilities/color";

  export let label: string;
  export let value: string;
  export let onUpdate: (value: Vector4) => void;

  const id = generateRandomId();

  function onChange() {
    const rgba = convertHexToRGBA(value);
    onUpdate(rgba);
  }
</script>

<label
  class="widgetLabel"
  for={id}>
    {label}
</label>
<input
  class="widgetColor"
  type="color"
  id={id}
  bind:value
  on:change={onChange} />