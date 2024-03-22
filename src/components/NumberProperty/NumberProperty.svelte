<script lang="ts">
  import { generateRandomId } from "utilities/ui";

  export let label: string;
  export let value: number;
  export let onUpdate: (value: number) => void;

  const id = generateRandomId();

  function onInput() {
    onUpdate(value);
  }
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
  on:input={onInput} />