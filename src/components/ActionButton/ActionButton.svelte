<script lang="ts">
  import { postMessageToPlugin } from "utilities/pluginUI";
  import Button from "components/Button";

  export let label: string;
  export let action: PluginMessageAction;
  export let disabled = false;

  function onClick() {
    postMessageToPlugin(action);
  }
</script>

<Button {label} {disabled} onClick={onClick} />