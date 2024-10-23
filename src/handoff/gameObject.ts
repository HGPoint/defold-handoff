/**
 * Module for handling Defold game objects in Figma.
 * @packageDocumentation
 */

import { generateGameObjectDataSet, generateGameObjectData } from "utilities/gameObjectDataGenerators";
import { serializeGameObjectDataSet, serializeGameObjectData } from "utilities/gameObjectDataSerializers";
import { removePluginData, getPluginData, setPluginData, tryUpdateLayerName } from "utilities/figma";
import { inferGameObjects } from "utilities/inference";
import { shouldUpdateGameObject } from "utilities/gameObject";
import { tryRefreshSlice9Placeholder, isSlice9PlaceholderLayer, findOriginalLayer } from "utilities/slice9";
import { tryRefreshScalePlaceholder } from "utilities/scale";

export async function copyGameObject(layer: ExportableLayer): Promise<SerializedGameObjectData> {
  const gameObjectData = await generateGameObjectData(layer);
  const serializedGameObjectData = serializeGameObjectData(gameObjectData);
  return serializedGameObjectData;
}

export async function exportGameObjects(layers: ExportableLayer[]): Promise<SerializedGameObjectData[]> {
  const gameObjectData = await generateGameObjectDataSet(layers);
  const serializedGameObjectsData = serializeGameObjectDataSet(gameObjectData);
  return serializedGameObjectsData;
}

export async function updateGameObject(layer: ExportableLayer, data: PluginGameObjectData) {
  const originalLayer = isSlice9PlaceholderLayer(layer) ? findOriginalLayer(layer) : layer;
  if (originalLayer) {
    const pluginData = getPluginData(originalLayer, "defoldGameObject");
    const updatedPluginData: PluginGameObjectData = { ...pluginData, ...data };
    if (await shouldUpdateGameObject(layer, pluginData, updatedPluginData)) {
      const gameObjectData = { defoldGameObject: { ...pluginData, ...data } };
      setPluginData(originalLayer, gameObjectData);
      tryUpdateLayerName(originalLayer, data.id);
      tryRefreshSlice9Placeholder(originalLayer, data.slice9, pluginData?.slice9)
      tryRefreshScalePlaceholder(layer, data.scale, pluginData?.scale);
    }
  }
}

export function fixGameObjects(layers: SceneNode[]) {
  inferGameObjects(layers);
}

/**
 * Removes bound GUI node data for a given Figma layer.
 * @param layer - Figma layer to reset GUI node data for.
 */
export function removeGameObject(layer: SceneNode) {
  removePluginData(layer, "defoldGameObject");
  removePluginData(layer, "defoldSlice9");
}

/**
 * Removes bound GUI node data for an array of Figma layers.
 * @param layers - Figma layers to reset GUI nodes for.
 */
export function removeGameObjects(layers: SceneNode[]) {
  layers.forEach((layer) => { removeGameObject(layer) });
}
