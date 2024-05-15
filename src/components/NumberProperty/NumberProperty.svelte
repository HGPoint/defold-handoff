<script lang="ts">
  import { generateRandomId } from "utilities/pluginUI";
  import NumberInput from "components/NumberInput";

  export let label: string;
  export let value: number;
  export let disabled = false;

  const id = generateRandomId();
</script>

<label
  class="widgetLabel"
  for={id}>
    {label}
</label>
<NumberInput
  {id}
  bind:value={value}
  disabled={disabled} />