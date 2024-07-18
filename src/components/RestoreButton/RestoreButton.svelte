<script lang="ts" generics="T">

  export let value: T;
  export let originalValue: T;

  function restoreValue() {
    value = originalValue;
  }
</script>

<button
  class="restoreButton"
  on:click={restoreValue}>
    Restore
</button>