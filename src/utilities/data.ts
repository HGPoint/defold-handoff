/**
 * Handles basic data processing.
 * @packageDocumentation
 */

import { PROJECT_CONFIG } from "handoff/project";
import { getPluginData, isFigmaComponentInstance, isFigmaRectangle, isLayerData, isLayerExportable, isLayerGUINode, isLayerGameObject, isLayerSprite, isLayerSpriteHolder } from "utilities/figma";
import { isSlice9PlaceholderLayer, isSlice9ServiceLayer } from "utilities/slice9";

/**
 * Checks if the data bound to the Figma layer was already inferred.
 * @param layer - The Figma layer to check.
 * @param pluginDataKey - The plugin data key to check. 
 * @returns True if the layer was inferred, otherwise false.
 */
export function isLayerInferred(layer: SceneNode, pluginDataKey: "defoldGUINode" | "defoldGameObject"): boolean {
  if (isLayerData(layer)) {
    const data = getPluginData(layer, pluginDataKey);
    const inferred = !!data && data.inferred;
    return inferred;
  }
  return false;
}

/**
 * Checks if the Figma layer is skippable on export.
 * @async
 * @param layer - The Figma layer to check.
 * @param data - The plugin data bound to the Figma layer.
 * @returns True if the layer is skippable, otherwise false.
 */
export async function isLayerSkippable(layer: ExportableLayer, data: GUINodeData | GameObjectData | PluginGUINodeData | PluginGameObjectData): Promise<boolean> {
  return data.skip ||
    layer.name.startsWith(PROJECT_CONFIG.autoskip) ||
    isSlice9PlaceholderLayer(layer) ||
    await isLayerSpriteHolder(layer);
}

/**
 * Determines whether the Figma layer can be processed.
 * @param layer - The Figma layer to check.
 * @returns True if the layer can be processed, otherwise false.
 */
export function canProcessChildLayer(layer: SceneNode): layer is ExportableLayer {
  return (isLayerExportable(layer) || isFigmaRectangle(layer)) && !isSlice9ServiceLayer(layer);
}

/**
 * Determines whether the plugin data should be updated.
 * @async
 * @param layer - The Figma layer to check.
 * @param updatedPluginData - The updated plugin data.
 * @param pluginData - The current plugin data.
 * @returns True if the plugin data should be updated, otherwise false.
 */
export async function shouldUpdatePluginData<T extends Record<string, unknown>>(layer: DataLayer, updatedPluginData: T, pluginData?: WithNull<T>) {
  if (!pluginData) {
    if (await isLayerSprite(layer)) {
      return true;
    } else if (isFigmaComponentInstance(layer)) {
      return false;
    }
    return true;
  }
  return await isDataUpdated(pluginData, updatedPluginData);
}

/**
 * Determines whether the plugin data is actually updated.
 * @async
 * @param data - The current plugin data.
 * @param updatedData - The potentially updated plugin data.
 * @returns True if the plugin data is updated, otherwise false.
 */
export async function isDataUpdated<T extends Record<string, unknown>>(data: T, updatedData: T) {
  const keys = Object.keys(updatedData) as (keyof T)[];
  const dataUpdated = keys.some((key) => isDataValueUpdated(data[key], updatedData[key]));
  return dataUpdated;
}

/**
 * Determines whether a data value is updated.
 * @param value - The current data value.
 * @param updatedValue - The potentially updated data value.
 * @returns True if the data value is updated, otherwise false.
 */
function isDataValueUpdated<T>(value: T, updatedValue: T) {
  return JSON.stringify(value) !== JSON.stringify(updatedValue);
}

/**
 * Resolves the plugin data key for a Figma layer.
 * @param layer - The Figma layer for which to resolve the plugin data key.
 * @returns The plugin data key.
 */
export function resolvePluginDataKey(layer: SceneNode): WithNull<"defoldGUINode" | "defoldGameObject"> {
  if (isLayerGUINode(layer)) {
    return "defoldGUINode";
  } else if (isLayerGameObject(layer)) {
    return "defoldGameObject";
  }
  return null
}
