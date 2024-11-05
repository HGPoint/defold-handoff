<script lang="ts">
  import { convertHexToRGBA, convertRGBAToHex } from "utilities/color";
  import { generateRandomId } from "utilities/ui";

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
  {id}
  value={color}
  on:change={onChange}
  {disabled} />