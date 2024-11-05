<script lang="ts">
  import DeveloperAtlasPage from "components/DeveloperAtlasPage";
  import DeveloperAtlasesPage from "components/DeveloperAtlasesPage";
  import DeveloperGUINodePage from "components/DeveloperGUINodePage";
  import DeveloperGUINodesPage from "components/DeveloperGUINodesPage";
  import DeveloperLayerPage from "components/DeveloperLayerPage";
  import DeveloperLayersPage from "components/DeveloperLayersPage";
  import DeveloperProjectPage from "components/DeveloperProjectPage";
  import DeveloperSectionPage from "components/DeveloperSectionPage";
  import DeveloperSectionsPage from "components/DeveloperSectionsPage";
  import selectionState from "state/selection";
  import { areMultipleAtlasesSelected, areMultipleGUINodesSelected, areMultipleLayersSelected, areMultipleSectionsSelected, isAtlasSelected, isGUINodeSelected, isLayerSelected, isSectionSelected } from "utilities/selection";
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
