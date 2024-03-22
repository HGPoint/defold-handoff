<script lang="ts">
  import { generateRandomId } from "utilities/ui";

  export let label: string;
  export let value: boolean;

  const id = generateRandomId();
</script>

<label
  class="widgetLabel"
  for={id}>
    {label}
</label>
<input
  class="widgetCheckbox"
  type="checkbox"
  id={id}
  bind:checked={value} />