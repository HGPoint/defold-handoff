<script lang="ts">
  import uiState from "state/ui"

  export let title = "Actions"
  export let collapseKey: keyof UIData | null = null

  function onCollapseClick() {
    if (collapseKey) {
      $uiState[collapseKey] = !$uiState[collapseKey];
    }
  }
</script>

<section class="actions">
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