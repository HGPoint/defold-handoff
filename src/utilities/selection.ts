import { isSlice9PlaceholderLayer, isSlice9ServiceLayer, findOriginalLayer } from "utilities/slice9";
import { isAtlas, isFigmaFrame, isFigmaComponentInstance, isFigmaText, getPluginData } from "utilities/figma";

function isSelectable(layer: SceneNode): boolean {
  return layer.type !== "GROUP" && !isSlice9ServiceLayer(layer);
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
  data.push({ ...pluginData, type });
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