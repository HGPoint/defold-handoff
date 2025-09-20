/**
 * Handles editing of GUI nodes in Figma.
 * @packageDocumentation
 */

import delay from "utilities/delay";
import { shouldUpdatePluginData } from "utilities/data";
import { isFigmaSceneNode, isLayerData, isLayerNode, selectFigmaLayer, setPluginData, tryUpdateFigmaLayerName, tryUpdateFigmaLayerScale } from "utilities/figma";
import { getGUINodePluginData } from "utilities/gui";
import { ensureOriginalLayer, tryRefreshSlice9Placeholder, slice9WasCreated } from "utilities/slice9";

/**
 * Ensures that the layer is a GUI node layer.
 * @param layer - The layer to ensure is a GUI node layer.
 * @returns The GUI node layer, or null if the layer is not a GUI node layer.
 */
export function ensureGUILayer(layer: DataLayer) {
  const originalLayer = ensureOriginalLayer(layer);
  if (originalLayer && isLayerData(originalLayer)) {
    return originalLayer;
  }
  return null;
}

/**
 * Extracts the GUI node data before updating it.
 * @param layer - The Figma layer to extract the GUI node data from.
 * @returns The original GUI node data, or null if the layer is not a GUI node layer.
 */
export async function extractGUIOriginalData(layer: DataLayer) {
  if (isLayerNode(layer)) {
    const pluginData = getGUINodePluginData(layer);
    return pluginData;
  }
  return null;
}

/**
 * Completes the GUI node data with the original data.
 * @param layer - The Figma layer to complete the GUI node data for.
 * @param update - The updated GUI node data.
 * @param originalData - The original GUI node data.
 * @returns The complete GUI node data.
 */
export async function completeGUIData(layer: DataLayer, update: PluginGUINodeData, originalData: WithNull<PluginGUINodeData>) {
  const completeData: PluginGUINodeData = { ...originalData, ...update };
  return completeData;
}

/**
 * Updates the GUI node data.
 * @param layer - The Figma layer to update the GUI node data for.
 * @param updateData - The updated GUI node data.
 * @param originalData - The original GUI node data.
 * @returns True if the GUI node data was updated, false otherwise.
 */
export async function updateGUIData(layer: DataLayer, updateData: PluginGUINodeData, originalData: WithNull<PluginGUINodeData>) {
  if (await shouldUpdatePluginData(layer, updateData, originalData)) {
    const guiNodeData: PluginData = { defoldGUINode: updateData };
    setPluginData(layer, guiNodeData);
    return true;
  }
  return false;
}

/**
 * Updates the GUI node layer.
 * @param layer - The Figma layer to update.
 * @param updateData - The updated GUI node data.
 * @param originalData - The original GUI node data.
 */
export async function updateGUILayer(layer: DataLayer, updateData: PluginGUINodeData, originalData: WithNull<PluginGUINodeData>) {
  if (isLayerNode(layer)) {
    tryUpdateFigmaLayerName(layer, updateData.id);
    tryRefreshSlice9Placeholder(layer, updateData.slice9, originalData?.slice9);
    tryUpdateFigmaLayerScale(layer, updateData.scale_factor, originalData?.scale_factor);
    trySelectCreatedSlice9Placeholder(layer, updateData.slice9, originalData?.slice9)
  }
}

async function trySelectCreatedSlice9Placeholder(layer: DataLayer, updatedSlice9: Vector4, originalSlice9?: Vector4) {
  if (slice9WasCreated(updatedSlice9, originalSlice9)) {
    await delay(0.1)
    if (layer.parent && isFigmaSceneNode(layer.parent)) {
      selectFigmaLayer(layer.parent, true)
    }
  }
}
