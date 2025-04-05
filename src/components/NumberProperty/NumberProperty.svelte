<script lang="ts">
  import NumberInput from "components/NumberInput";
  import { generateRandomId } from "utilities/ui";

  export let label: string;
  export let value: number;
  export let disabled = false;
  export let min: number = 0;

  const id = generateRandomId();
</script>

<label
  class="widgetLabel"
  for={id}>
    {label}
</label>
<NumberInput
  {id}
  {min}
  bind:value={value}
  disabled={disabled} />
<slot />