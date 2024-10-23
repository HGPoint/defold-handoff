/**
 * Utility module for handling Defold game objects.
 * @packageDocumentation
 */

import { isFigmaText, isAtlasSprite, isFigmaComponentInstance } from "utilities/figma";

export async function resolvesGameObjectType(layer: ExportableLayer): Promise<GameObjectType> {
  if (isFigmaText(layer)) {
    return "TYPE_LABEL";
  }
  if (await isAtlasSprite(layer)) {
    return "TYPE_SPRITE";
  }
  return "TYPE_EMPTY";
}

/**
 * Checks if the given game object type is an empty type.
 * @param type - The type to check.
 * @returns True if the type is empty, otherwise false.
 */
export function isEmptyGameObjectType(type: GameObjectType) {
  return type === "TYPE_EMPTY";
}

/**
 * Checks if the given game object type is a sprite type.
 * @param type - The type to check.
 * @returns True if the type is sprite, otherwise false.
 */
export function isSpriteGameObjectType(type: GameObjectType) {
  return type === "TYPE_SPRITE";
}

/**
 * Checks if the given game object type is a label type.
 * @param type - The type to check.
 * @returns True if the type is label, otherwise false.
 */
export function isLabelGameObjectType(type: GameObjectType) {
  return type === "TYPE_LABEL";
}

async function isDataUpdated(pluginData: PluginGameObjectData, updatedPluginData: PluginGameObjectData) {
  const keys = Object.keys(updatedPluginData) as (keyof PluginGameObjectData)[];
  return keys.some((key) => JSON.stringify(pluginData[key]) !== JSON.stringify(updatedPluginData[key]));
}

export async function shouldUpdateGameObject(layer: ExportableLayer, pluginData: PluginGameObjectData | null | undefined, updatedPluginData: PluginGameObjectData) {
  if (!pluginData) {
    if (await isAtlasSprite(layer)) {
      return true;
    } else if (isFigmaComponentInstance(layer)) {
      return false;
    }
    return true;
  }
  return await isDataUpdated(pluginData, updatedPluginData);
}
