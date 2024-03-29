import config from "config/config.json";
import { isSlice9PlaceholderLayer, isSlice9ServiceLayer, findOriginalLayer } from "utilities/slice9";
import { isAtlas, isFigmaFrame, isFigmaSection, isFigmaComponentInstance, isFigmaText, getPluginData } from "utilities/figma";

function isSelectable(layer: SceneNode): boolean {
  return !isSlice9ServiceLayer(layer);
}

export function isGUINodeSelected(selection: SelectionData | SelectionUIData) {
  return selection?.gui?.length === 1;
}

export function areMultipleGUINodesSelected(selection: SelectionData | SelectionUIData) {
  return selection?.gui?.length > 1;
}

export function isAtlasSelected(selection: SelectionData | SelectionUIData) {
  return selection?.atlases?.length === 1;
}

export function areMultipleAtlasesSelected(selection: SelectionData | SelectionUIData) {
  return selection?.atlases?.length > 1;
}

export function isLayerSelected(selection: SelectionData | SelectionUIData) {
  return selection?.layers?.length === 1;
}

export function areMultipleLayersSelected(selection: SelectionData | SelectionUIData) {
  return selection?.layers?.length > 1;
}

export function isSectionSelected(selection: SelectionData | SelectionUIData) {
  return selection?.sections?.length === 1;
}

export function areMultipleSectionsSelected(selection: SelectionData | SelectionUIData) {
  return selection?.sections?.length > 1;
}

function pluginSelectionReducer(selection: SelectionData, layer: SceneNode): SelectionData {
  if (isSelectable(layer)) {
    if (isAtlas(layer)) {
      selection.atlases.push(layer);
    } else if (isFigmaSection(layer)) {
      selection.sections.push(layer);
    } else if (isFigmaFrame(layer) || isFigmaComponentInstance(layer) || isFigmaText(layer)) {
      const originalLayer = isSlice9PlaceholderLayer(layer) ? findOriginalLayer(layer) : layer;
      if (originalLayer) {
        selection.gui.push(originalLayer);
      }
    } else {
      selection.layers.push(layer);
    }
  }
  return selection;
}

export function reducePluginSelection(): SelectionData {
  const selection: SelectionData = { gui: [], atlases: [], layers: [], sections: [] };
  return figma.currentPage.selection.reduce(pluginSelectionReducer, selection);
}

function guiNodePluginUISelectionConverter(data: PluginGUINodeData[], layer: ExportableLayer): PluginGUINodeData[] {
  const pluginData = getPluginData(layer, "defoldGUINode");
  const { name: id } = layer;
  const type = isFigmaText(layer) ? "text" : "box";
  const skip = pluginData?.skip || false;
  const guiNodeData: PluginGUINodeData = { ...config.guiNodeDefaultValues, ...pluginData, id, type, skip };
  data.push(guiNodeData);
  return data;
}

function atlasPluginUISelectionConverter(data: PluginAtlasData[], layer: SceneNode): PluginAtlasData[] {
  const pluginData = getPluginData(layer, "defoldAtlas");
  if (pluginData) {
    data.push(pluginData);
  }
  return data;
}

function sectionPluginUISelectionConverter(data: PluginSectionData[], layer: SectionNode): PluginSectionData[] {
  const pluginData = getPluginData(layer, "defoldSection");
  const { name: id } = layer;
  const sectionData: PluginSectionData = { ...config.sectionDefaultValues, ...pluginData, id };
  data.push(sectionData);
  return data;
}

export function convertPluginUISelection(selection: SelectionData): SelectionUIData {
  return {
    gui: selection.gui.reduce(guiNodePluginUISelectionConverter, []),
    atlases: selection.atlases.reduce(atlasPluginUISelectionConverter, []),
    layers: selection.layers,
    sections: selection.sections.reduce(sectionPluginUISelectionConverter, []),
  }
}