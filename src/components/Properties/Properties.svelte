<script lang="ts">
  import uiState from "state/ui";

  export let title = "Properties"
  export let collapseKey: keyof Omit<UIData, "mode" | "collapsed"> | undefined = undefined;

  function onCollapseClick() {
    if (collapseKey) {
      $uiState[collapseKey] = !$uiState[collapseKey];
    }
  }
</script>

<section class="properties">
  <header class="sectionHeader">
    {#if collapseKey}
      <button
        class="sectionToggle"
        on:click={onCollapseClick}
        class:sectionToggle-is-collapsed={$uiState[collapseKey]}>
          {title}
      </button>
    {:else}
      {title}
    {/if}
  </header>
  {#if !collapseKey || !$uiState[collapseKey]}
    <slot />
  {/if}
</section>