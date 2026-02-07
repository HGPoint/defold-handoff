<script lang="ts">
  import Button from "components/Button";
  import clipboardState from "state/clipboard";
  import copyOnClipboard from "utilities/clipboard";

  let textarea: WithNull<HTMLTextAreaElement> = null;

  function onCloseClick() {
    $clipboardState = null;
  }

  function onClipboardStateUpdate(state: WithNull<string>) {
    textarea?.select();
  }

  function onTextAreaClick() {
    textarea?.select();
  }

  function onCopyClick() {
    if ($clipboardState) {
      textarea?.select();
      copyOnClipboard($clipboardState)
    }
  }

  $: onClipboardStateUpdate($clipboardState)
</script>

{#if $clipboardState}
  <div class="clipboardHelperOverlay">
    <Button label="Close" onClick={onCloseClick} />
    <Button label="Copy" onClick={onCopyClick} />
    <textarea
      bind:this={textarea}
      on:click={onTextAreaClick}
      name="clipboardHelper"
      id="clipboardHelper"
      class="clipboardHelper"
      readonly>{$clipboardState}</textarea>
  </div>
{/if}
