<script lang="ts">
  import Button from "components/Button";
  import { generateRandomId } from "utilities/ui";

  export let label: string;
  export let action: string;
  export let value: { id: string, name: string }[];
  export let disabled = false;

  const id = generateRandomId();

  function addValue() {
    const valueId = generateRandomId();
    value = [ ...value, { id: valueId, name: "" } ];
  }

  function removeValue(index: number) {
    value = value.filter((itemValue, itemIndex) => index !== itemIndex);
  }

  function onAddClick() {
    addValue();
  }

  function onRemoveClick(index: number) {
    removeValue(index);
  }
</script>

{#if value[0]}
  <label
    class="widgetLabel"
    for={`${id}-${value[0].id}`}>
      {label}
  </label>
{:else}
  <span
    class="widgetLabel">
    {label}
  </span>
{/if}
<div class="widgetTextSet">
  {#each value as setValue, index (setValue.id)}
    <div class="widgetTextSetItem">
      <input
        class="widgetInput"
        type="text"
        id={`${id}-${index}`}
        bind:value={setValue.name}
        {disabled} />
      <Button label="Remove" {disabled} onClick={() => { onRemoveClick(index); }} />
    </div>
  {/each}
  <Button label={action} {disabled} onClick={onAddClick} />
</div>