<script lang="ts">
  import { generateRandomId } from "utilities/ui";
  import { convertHexToRGBA, convertRGBAToHex } from "utilities/color";

  export let label: string;
  export let value: Vector4;
  export let disabled = false;

  const id = generateRandomId();

  $: color = convertRGBAToHex(value);

  function onChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const color = input.value;
    value = convertHexToRGBA(color);
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
  value={color}
  on:change={onChange}
  {disabled} />