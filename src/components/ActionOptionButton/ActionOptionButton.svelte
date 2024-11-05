<script lang="ts">
  import Button from "components/Button";
  import NumberInput from "components/NumberInput";
  import { postMessageToPlugin } from "utilities/ui";

  export let label: string;
  export let value: number;
  export let min: number = 0;
  export let max: number = 1;
  export let action: PluginMessageAction;
  export let disabled = false;

  function onClick() {
    postMessageToPlugin(action, { option: value });
  }
</script>


<div class="widgetActionOption">
  <Button
    {label}
    {disabled}
    onClick={onClick} />
  <NumberInput
    bind:value={value}
    {min}
    {max}
    disabled={disabled} />
</div>