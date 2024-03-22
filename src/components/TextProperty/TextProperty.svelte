<script lang="ts">
  import { generateRandomId } from "utilities/ui";

  export let label: string;
  export let value: string;
  export let onUpdate: (value: string) => void;

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
  type="text"
  id={id}
  bind:value
  on:input={onInput} />