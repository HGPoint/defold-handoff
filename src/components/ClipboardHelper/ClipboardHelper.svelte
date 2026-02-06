<script lang="ts">
  import Button from "components/Button";
  import { postMessageToPlugin } from "utilities/ui";
  import clipboardState from "state/clipboard";

  let textarea;

  function onCloseClick() {
    $clipboardState = null;
  }

  function onClipboardStateUpdate() {
    textarea?.select();
  }

  function onTextAreaClick() {
    textarea?.select();
  }

  $: onClipboardStateUpdate($clipboardState)
</script>

{$clipboardState != null}
{#if $clipboardState}
  <div class="clipboardHelperOverlay">
    <Button label="Close" onClick={onCloseClick} />
    <textarea
      bind:this={textarea}
      on:click={onTextAreaClick}
      name="clipboardHelper"
      id="clipboardHelper"
      class="clipboardHelper"
      readonly={true}>{$clipboardState}</textarea>
  </div>
{/if}

