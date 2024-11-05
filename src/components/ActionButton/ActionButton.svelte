<script lang="ts">
  import Button from "components/Button";
  import { postMessageToPlugin } from "utilities/ui";

  export let label: string;
  export let action: PluginMessageAction;
  export let disabled = false;

  function onClick() {
    postMessageToPlugin(action);
  }
</script>

<Button {label} {disabled} onClick={onClick} />