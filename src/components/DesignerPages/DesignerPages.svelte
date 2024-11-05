<script lang="ts">
  import DesignerAtlasPage from "components/DesignerAtlasPage";
  import DesignerAtlasesPage from "components/DesignerAtlasesPage";
  import DesignerGUINodePage from "components/DesignerGUINodePage";
  import DesignerLayerPage from "components/DesignerLayerPage";
  import DesignerLayersPage from "components/DesignerLayersPage";
  import DesignerSectionPage from "components/DesignerSectionPage";
  import DesignerSectionsPage from "components/DesignerSectionsPage";
  import selectionState from "state/selection";
  import { areMultipleAtlasesSelected, areMultipleLayersSelected, areMultipleSectionsSelected, isAtlasSelected, isGUINodeSelected, isLayerSelected, isSectionSelected } from "utilities/selection";
</script>

{#if $selectionState}
  {#if areMultipleSectionsSelected($selectionState)}
    <DesignerSectionsPage />
  {:else if isSectionSelected($selectionState)}
    <DesignerSectionPage />
  {:else if areMultipleAtlasesSelected($selectionState)}
    <DesignerAtlasesPage />
  {:else if isAtlasSelected($selectionState)}
    <DesignerAtlasPage />
  {:else if isGUINodeSelected($selectionState)}
    <DesignerGUINodePage />
  {:else if areMultipleLayersSelected($selectionState)}
    <DesignerLayersPage />
  {:else if isLayerSelected($selectionState)}
    <DesignerLayerPage />
  {/if}
{/if}
