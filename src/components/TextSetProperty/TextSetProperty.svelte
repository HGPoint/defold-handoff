<script lang="ts">
  import { generateRandomId } from "utilities/pluginUI";
  import Button from "components/Button";

  export let label: string;
  export let value: string[];
  export let disabled = false;

  const id = generateRandomId();

  function addValue() {
    value = [...value, ""];
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

<label
  class="widgetLabel"
  for={`${id}-0`}>
    {label}
</label>
<div class="widgetTextSet">
  {#each value as textValue, index}
    <div class="widgetTextSetItem">
      <input
        class="widgetInput"
        type="text"
        id={`${id}-${index}`}
        bind:value={value[index]}
        {disabled} />
      <Button label="Remove" {disabled} onClick={() => { onRemoveClick(index); }} />
    </div>
  {/each}
  <Button label="Add Font" {disabled} onClick={onAddClick} />
</div>