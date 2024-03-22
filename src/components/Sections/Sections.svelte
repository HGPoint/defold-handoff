<script lang="ts">
  import { isLayerSelected, areMultipleAtlasesSelected, areMultipleLayersSelected, isGUINodeSelected, areMultipleGUINodesSelected, isAtlasSelected } from "utilities/figma";
  import AtlasSection from "components/AtlasSection";
  import AtlasesSection from "components/AtlasesSection";
  import GUINodeSection from "components/GUINodeSection";
  import GUINodesSection from "components/GUINodesSection";
  import LayerSection from "components/LayerSection";
  import LayersSection from "components/LayersSection";
  import StartSection from "components/StartSection";

  export let selection: SelectionData;
</script>

{#if areMultipleAtlasesSelected(selection)}
  <AtlasesSection />
{:else if isAtlasSelected(selection)}
  <AtlasSection />
{:else if areMultipleGUINodesSelected(selection)}
  <GUINodesSection />
{:else if isGUINodeSelected(selection)}
  <GUINodeSection />
{:else if areMultipleLayersSelected(selection)}
  <LayersSection />
{:else if isLayerSelected(selection)}
  <LayerSection />
{:else}
  <StartSection />
{/if}
