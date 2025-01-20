/**
 * Handles editing of game objects in Figma.
 * @packageDocumentation
 */

import { shouldUpdatePluginData } from "utilities/data";
import { isLayerData, isLayerNode, setPluginData, tryUpdateFigmaLayerName } from "utilities/figma";
import { findSlice9Layer, isSlice9PlaceholderLayer, tryRefreshSlice9Placeholder } from "utilities/slice9";
import { getGameObjectPluginData } from "utilities/gameCollection"

/**
 * Ensures that the layer is a game object layer.
 * @param layer - The layer to ensure is a game object layer.
 * @returns The game object layer, or null if the layer is not a game object layer.
 */
export function ensureGameObjectLayer(layer: DataLayer) {
  const originalLayer = isSlice9PlaceholderLayer(layer) ? findSlice9Layer(layer) : layer;
  if (originalLayer && isLayerData(originalLayer)) {
    return originalLayer;
  }
  return null;
}

/**
 * Extracts the game object data before updating it.
 * @param layer - The Figma layer to extract the game object data from.
 * @returns The original game object data, or null if the layer is not a game object layer.
 */
export async function extractGameObjectOriginalData(layer: DataLayer) {
  if (isLayerNode(layer)) {
    const pluginData = await getGameObjectPluginData(layer);
    return pluginData;
  }
  return null;
}

/**
 * Preprocesses the game object data before updating it.
 * @param layer - The Figma layer to preprocess the game object data for.
 * @returns The preprocessed game object data.
 */
export async function preprocessGameObjectData(layer: DataLayer, update: PluginGameObjectData, originalData: WithNull<PluginGameObjectData>) {
  const completeData = completeGameObjectData(layer, update, originalData);
  sanitizeGameObjectData(completeData);
  return completeData;
}

/**
 * Completes the game object data with the original data.
 * @param layer - The Figma layer to complete the game object data for.
 * @param update - The updated game object data.
 * @param originalData - The original game object data.
 * @returns The complete game object data.
 */
function completeGameObjectData(layer: DataLayer, update: PluginGameObjectData, originalData: WithNull<PluginGameObjectData>) {
  const completeData: PluginGameObjectData = { ...originalData, ...update };
  return completeData;
}

/**
 * Sanitizes the game object data before updating it.
 * @param update - The game object data to sanitize.
 */
function sanitizeGameObjectData(update: PluginGameObjectData) {
  if (update.position) {
    update.position.x = 0;
    update.position.y = 0;
  }
}

/**
 * Updates the game object data.
 * @param layer - The Figma layer to update the game object data for.
 * @param updateData - The updated game object data.
 * @param originalData - The original game object data.
 * @returns True if the game object data was updated, false otherwise.
 */
export async function updateGameObjectData(layer: DataLayer, updateData: PluginGameObjectData, originalData: WithNull<PluginGameObjectData>) {
  if (await shouldUpdatePluginData(layer, updateData, originalData)) {
    const gameObjectData: PluginData = { defoldGameObject: { ...updateData } };
    setPluginData(layer, gameObjectData);
    return true;
  }
  return false;
}

/**
 * Updates the game object layer.
 * @param layer - The Figma layer to update.
 * @param updateData - The updated game object data.
 * @param originalData - The original game object data.
 */
export async function updateGameObjectLayer(layer: DataLayer, updateData: PluginGameObjectData, originalData: WithNull<PluginGameObjectData>) {
  if (isLayerNode(layer)) {
    tryUpdateFigmaLayerName(layer, updateData.id);
    tryRefreshSlice9Placeholder(layer, updateData.slice9, originalData?.slice9);
  }
}
