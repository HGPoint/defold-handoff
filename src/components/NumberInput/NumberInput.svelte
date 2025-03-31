<script lang="ts">
  import evaluateExpression from "utilities/evaluation";
  import { clamp } from "utilities/math";

  export let id: WithNull<string> = null;
  export let value: number;
  export let min: number = Number.MIN_SAFE_INTEGER;
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

  function recalculateValue() {
    const result = calculateResult();
    value = result;
    refreshEditedValue(value);
  }

  function bumpValue(amount: number, shift: boolean) {
    const multiplier = shift ? 10 : 1;
    const newValue = value + amount * multiplier;
    value = clamp(newValue, min, max);
    refreshEditedValue(value);
  }

  function refreshEditedValue(updatedValue: number) {
    editedValue = updatedValue.toString();
  }

  function onBlur() {
    recalculateValue();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      recalculateValue();
    } else if (event.key === "ArrowUp") {
      bumpValue(1, event.shiftKey);
    } else if (event.key === "ArrowDown") {
      bumpValue(-1, event.shiftKey);
    }
  }

  $: refreshEditedValue(value);
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