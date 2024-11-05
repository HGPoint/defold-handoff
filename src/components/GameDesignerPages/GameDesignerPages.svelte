<script lang="ts">
  import GameDesignerAtlasPage from "components/GameDesignerAtlasPage";
  import GameDesignerAtlasesPage from "components/GameDesignerAtlasesPage";
  import GameDesignerGameObjectPage from "components/GameDesignerGameObjectPage";
  import GameDesignerGameObjectsPage from "components/GameDesignerGameObjectsPage";
  import GameDesignerLayerPage from "components/GameDesignerLayerPage";
  import GameDesignerLayersPage from "components/GameDesignerLayersPage";
  import GameDesignerSectionPage from "components/GameDesignerSectionPage";
  import GameDesignerSectionsPage from "components/GameDesignerSectionsPage";
  import selectionState from "state/selection";
  import { areMultipleAtlasesSelected, areMultipleGameObjectsSelected, areMultipleLayersSelected, areMultipleSectionsSelected, isAtlasSelected, isGameObjectSelected, isLayerSelected, isSectionSelected } from "utilities/selection";
</script>

{#if $selectionState}
  {#if areMultipleSectionsSelected($selectionState)}
    <GameDesignerSectionsPage />
  {:else if isSectionSelected($selectionState)}
    <GameDesignerSectionPage />
  {:else if areMultipleAtlasesSelected($selectionState)}
    <GameDesignerAtlasesPage />
  {:else if isAtlasSelected($selectionState)}
    <GameDesignerAtlasPage />
  {:else if areMultipleGameObjectsSelected($selectionState)}
    <GameDesignerGameObjectsPage />
  {:else if isGameObjectSelected($selectionState)}
    <GameDesignerGameObjectPage />
  {:else if areMultipleLayersSelected($selectionState)}
    <GameDesignerLayersPage />
  {:else if isLayerSelected($selectionState)}
    <GameDesignerLayerPage />
  {/if}
{/if}
