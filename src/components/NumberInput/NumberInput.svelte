<script lang="ts">
  import { evaluateExpression } from "utilities/evaluation";
  import { clamp } from "utilities/math";

  export let id: string | null = null;
  export let value: number;
  export let min: number = 0;
  export let max: number = Number.MAX_SAFE_INTEGER;
  export let disabled = false;

  let editedValue: string = value.toString();

  function calculateResult() {
    if (editedValue === "") {
      return 0;
    }
    const result = evaluateExpression(editedValue);
    if (typeof result === "number") {
      return clamp(result, min, max);
    }
    return clamp(value, min, max);
  }

  function refreshEditedValue() {
    const result = calculateResult();

    editedValue = result.toString();
  }

  function bumpValue(amount: number, shift: boolean) {
    const multiplier = shift ? 10 : 1;
    editedValue = (value + amount * multiplier).toString();
  }

  function updateValue(editedValue: string) {
    value = calculateResult();
  }

  function onBlur() {
    refreshEditedValue();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      refreshEditedValue();
    } else if (event.key === "ArrowUp") {
      bumpValue(1, event.shiftKey);
    } else if (event.key === "ArrowDown") {
      bumpValue(-1, event.shiftKey);
    }
  }

  $: updateValue(editedValue);
</script>

<input
  {id}
  {min}
  {max}
  class="widgetInput"
  pattern="[0-9\+\-\*\/\s]*"
  bind:value={editedValue}
  on:blur={onBlur}
  on:keydown={onKeyDown}
  {disabled} />