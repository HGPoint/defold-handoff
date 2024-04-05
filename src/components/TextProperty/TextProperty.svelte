<script lang="ts">
  import { generateRandomId } from "utilities/pluginUI";

  export let label: string;
  export let value: string;
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
  type="text"
  id={id}
  bind:value
  {disabled} />