import { isSlice9PlaceholderLayer, isSlice9ServiceLayer, findOriginalLayer } from "utilities/slice9";
import { isAtlas, isFigmaFrame, isFigmaComponentInstance, isFigmaText, getPluginData } from "utilities/figma";

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

function pluginSelectionReducer(selection: SelectionData, layer: SceneNode): SelectionData {
  if (isSelectable(layer)) {
    if (isAtlas(layer)) {
      selection.atlases.push(layer);
    } else if (isFigmaFrame(layer) || isFigmaComponentInstance(layer) || isFigmaText(layer)) {
      const originalLayer = isSlice9PlaceholderLayer(layer) ? findOriginalLayer(layer) : layer;
      selection.gui.push(originalLayer);
    } else {
      selection.layers.push(layer);
    }
  }
  return selection;
}

export function reducePluginSelection(): SelectionData {
  const selection: SelectionData = { gui: [], atlases: [], layers: [] };
  return figma.currentPage.selection.reduce(pluginSelectionReducer, selection);
}

function guiNodePluginUISelectionConverter(data: PluginGUINodeData[], layer: ExportableLayer): PluginGUINodeData[] {
  const pluginData = getPluginData(layer, "defoldGUINode");
  const type = isFigmaText(layer) ? "text" : "box";
  const id = layer.name;
  data.push({ ...pluginData, type, id });
  return data;
}

function atlasPluginUISelectionConverter(data: PluginAtlasData[], layer: SceneNode): PluginAtlasData[] {
  const pluginData = getPluginData(layer, "defoldAtlas");
  if (pluginData) {
    data.push(pluginData);
  }
  return data;
}

export function convertPluginUISelection(selection: SelectionData): SelectionUIData {
  return {
    gui: selection.gui.reduce(guiNodePluginUISelectionConverter, []),
    atlases: selection.atlases.reduce(atlasPluginUISelectionConverter, []),
    layers: selection.layers,
  }
}