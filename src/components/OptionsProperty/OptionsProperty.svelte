<script lang="ts">
  import { generateRandomId } from "utilities/ui";

  export let label: string;
  export let value: string;
  export let options: Record<string, string>;

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
  bind:value>
  {#each Object.keys(options) as key}
    <option value={key}>{options[key]}</option>
  {/each}
</select>