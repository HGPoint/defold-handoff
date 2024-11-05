<script lang="ts">
  import DesignerPages from "components/DesignerPages";
  import DeveloperPages from "components/DeveloperPages";
  import GameDesignerPages from "components/GameDesignerPages";
  import uiState from "state/ui";
</script>

{#if $uiState.mode === "developer"}
  <DeveloperPages />
{:else if $uiState.mode === "designer"}
  <DesignerPages />
{:else if $uiState.mode === "game-designer"}
  <GameDesignerPages />
{/if}