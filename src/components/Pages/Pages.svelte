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

  let selection: SelectionUIData;

  selectionState.subscribe((value) => { selection = value; });
</script>

{#if areMultipleSectionsSelected(selection)}
  <SectionsPage />
{:else if isSectionSelected(selection)}
  <SectionPage />
{:else if areMultipleAtlasesSelected(selection)}
  <AtlasesPage />
{:else if isAtlasSelected(selection)}
  <AtlasPage />
{:else if areMultipleGUINodesSelected(selection)}
  <GUINodesPage />
{:else if isGUINodeSelected(selection)}
  <GUINodePage />
{:else if areMultipleLayersSelected(selection)}
  <LayersPage />
{:else if isLayerSelected(selection)}
  <LayerPage />
{:else}
  <ProjectPage />
{/if}
