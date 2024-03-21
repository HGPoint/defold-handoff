<script lang="ts">
  import { isLayerSelected, areMultipleAtlasesSelected, areMultipleLayersSelected, isGUINodeSelected, areMultipleGUINodesSelected, isAtlasSelected } from '../../../utilities/figma';
  import AtlasSection from "../AtlasSection";
  import AtlasesSection from "../AtlasesSection";
  import GUINodeSection from "../GUINodeSection";
  import GUINodesSection from "../GUINodesSection";
  import LayerSection from "../LayerSection";
  import LayersSection from "../LayersSection";
  import StartSection from "../StartSection";

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
