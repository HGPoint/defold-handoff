<script lang="ts">
  import uiState from "state/ui";
  import DeveloperPages from "components/DeveloperPages";
  import DesignerPages from "components/DesignerPages";
</script>

{#if $uiState.mode === "developer"}
  <DeveloperPages />
{:else if $uiState.mode === "designer"}
  <DesignerPages />
{/if}