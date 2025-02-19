/**
 * 
 * @packageDocumentation
 */

import { getAtlasPluginData } from "utilities/atlas";
import { shouldUpdatePluginData } from "utilities/data";
import { isLayerAtlas, setPluginData } from "utilities/figma";

export function ensureAtlasLayer(layer: DataLayer) {
  return layer;
}

export async function extractAtlasOriginalData(layer: DataLayer) {
  if (isLayerAtlas(layer)) {
    const pluginData = getAtlasPluginData(layer);
    return pluginData;
  }
  return null;
}

export async function completeAtlasData(layer: DataLayer, update: PluginAtlasData, originalData: WithNull<PluginAtlasData>) {
  const completeData: PluginAtlasData = { ...originalData, ...update };
  return completeData;
}

export async function updateAtlasData(layer: DataLayer, updateData: PluginAtlasData, originalData: WithNull<PluginAtlasData>) {
  if (await shouldUpdatePluginData(layer, updateData, originalData)) {
    const guiNodeData: PluginData = { defoldAtlas: updateData };
    setPluginData(layer, guiNodeData);
    return true;
  }
  return false;
}
