<script lang="ts" generics="T">
  import { generateRandomId } from "utilities/ui";

  export let label: string;
  export let value: T;
  export let options: Record<string, T>;
  export let disabled = false;

  const id = generateRandomId();
</script>

<label
  class="widgetLabel"
  for={id}>
    {label}
</label>
<select
  class="widgetSelect"
  id={id}
  bind:value
  {disabled}>
    {#each Object.keys(options) as key}
      <option value={options[key]}>{key}</option>
    {/each}
</select>