/**
 * Module for handling Defold game objects in Figma.
 * @packageDocumentation
 */

import { removePluginData } from "utilities/figma";
import { inferGameObjects } from "utilities/inference";

export async function exportGameObjects(layers: ExportableLayer[]): Promise<SerializedGameObjectData[]> {
  console.log("Export game objects", layers);
  return [];
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
