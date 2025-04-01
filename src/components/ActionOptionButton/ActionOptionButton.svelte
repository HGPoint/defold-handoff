<script lang="ts">
  import Button from "components/Button";
  import NumberInput from "components/NumberInput";
  import { postMessageToPlugin } from "utilities/ui";

  export let label: string;
  export let value: number;
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
    min={0.1}
    disabled={disabled} />
</div>