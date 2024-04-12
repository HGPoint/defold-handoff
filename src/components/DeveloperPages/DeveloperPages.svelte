<script lang="ts">
  import selectionState from "state/selection";
  import { isLayerSelected, areMultipleAtlasesSelected, areMultipleLayersSelected, isGUINodeSelected, areMultipleGUINodesSelected, isAtlasSelected, areMultipleSectionsSelected, isSectionSelected } from "utilities/selection";
  import DeveloperAtlasPage from "components/DeveloperAtlasPage";
  import DeveloperAtlasesPage from "components/DeveloperAtlasesPage";
  import DeveloperGUINodePage from "components/DeveloperGUINodePage";
  import DeveloperGUINodesPage from "components/DeveloperGUINodesPage";
  import DeveloperLayerPage from "components/DeveloperLayerPage";
  import DeveloperLayersPage from "components/DeveloperLayersPage";
  import DeveloperSectionPage from "components/DeveloperSectionPage";
  import DeveloperSectionsPage from "components/DeveloperSectionsPage";
  import DeveloperProjectPage from "components/DeveloperProjectPage";
</script>

{#if $selectionState}
  {#if areMultipleSectionsSelected($selectionState)}
    <DeveloperSectionsPage />
  {:else if isSectionSelected($selectionState)}
    <DeveloperSectionPage />
  {:else if areMultipleAtlasesSelected($selectionState)}
    <DeveloperAtlasesPage />
  {:else if isAtlasSelected($selectionState)}
    <DeveloperAtlasPage />
  {:else if areMultipleGUINodesSelected($selectionState)}
    <DeveloperGUINodesPage />
  {:else if isGUINodeSelected($selectionState)}
    <DeveloperGUINodePage />
  {:else if areMultipleLayersSelected($selectionState)}
    <DeveloperLayersPage />
  {:else if isLayerSelected($selectionState)}
    <DeveloperLayerPage />
  {:else}
    <DeveloperProjectPage />
  {/if}
{/if}
