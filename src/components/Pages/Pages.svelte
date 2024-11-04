<script lang="ts">
  import uiState from "state/ui";
  import DeveloperPages from "components/DeveloperPages";
  import DesignerPages from "components/DesignerPages";
  import GameDesignerPages from "components/GameDesignerPages";
</script>

{#if $uiState.mode === "developer"}
  <DeveloperPages />
{:else if $uiState.mode === "designer"}
  <DesignerPages />
{:else if $uiState.mode === "game-designer"}
  <GameDesignerPages />
{/if}