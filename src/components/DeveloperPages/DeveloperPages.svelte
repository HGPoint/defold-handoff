<script lang="ts">
  import selectionState from "state/selection";
  import { isLayerSelected, areMultipleAtlasesSelected, areMultipleLayersSelected, isGUINodeSelected, areMultipleGUINodesSelected, isAtlasSelected, areMultipleSectionsSelected, isSectionSelected } from "utilities/selection";
  import AtlasPage from "components/AtlasPage";
  import AtlasesPage from "components/AtlasesPage";
  import GUINodePage from "components/GUINodePage";
  import GUINodesPage from "components/GUINodesPage";
  import LayerPage from "components/LayerPage";
  import LayersPage from "components/LayersPage";
  import SectionPage from "components/SectionPage";
  import SectionsPage from "components/SectionsPage";
  import ProjectPage from "components/ProjectPage";
</script>

{#if $selectionState}
  {#if areMultipleSectionsSelected($selectionState)}
    <SectionsPage />
  {:else if isSectionSelected($selectionState)}
    <SectionPage />
  {:else if areMultipleAtlasesSelected($selectionState)}
    <AtlasesPage />
  {:else if isAtlasSelected($selectionState)}
    <AtlasPage />
  {:else if areMultipleGUINodesSelected($selectionState)}
    <GUINodesPage />
  {:else if isGUINodeSelected($selectionState)}
    <GUINodePage />
  {:else if areMultipleLayersSelected($selectionState)}
    <LayersPage />
  {:else if isLayerSelected($selectionState)}
    <LayerPage />
  {:else}
    <ProjectPage />
  {/if}
{/if}
