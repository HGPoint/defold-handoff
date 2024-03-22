<script lang="ts">
  import { generateRandomId } from "utilities/ui";

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
<input
  class="widgetInput"
  type="number"
  id={id}
  bind:value
  {disabled} />