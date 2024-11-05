/**
 * Provides endpoints for managing game object-related features, including editing, updating, and exporting game objects.
 * @packageDocumentation
 */

import { isLayerData, removePluginData } from "utilities/figma";
import { GAME_COLLECTION_EXPORT_PIPELINE, GAME_COLLECTION_SERIALIZATION_PIPELINE, GAME_OBJECT_UPDATE_PIPELINE } from "utilities/gameCollection";
import { inferGameObjects } from "utilities/inference";
import { runTransformPipeline, runTransformPipelines } from "utilities/transformPipeline";
import { runUpdatePipeline } from "utilities/updatePipeline";

/**
 * Exports serialized game collection data from an array of game object layers.
 * @param layers - The game objects to export.
 * @returns An array of serialized game collection data.
 */
export async function exportGameCollections(layers: ExportableLayer[]): Promise<SerializedGameCollectionData[]> {
  const exportGameCollectionData = await runTransformPipelines(GAME_COLLECTION_EXPORT_PIPELINE, layers);
  const serializedGameCollectionData = await runTransformPipelines(GAME_COLLECTION_SERIALIZATION_PIPELINE, exportGameCollectionData);
  return serializedGameCollectionData;
}

/**
 * Exports serialized game collection data from a game object layer.
 * @param layer - The game object to export.
 * @returns Serialized game collection data.
 */
export async function copyGameCollection(layer: ExportableLayer): Promise<SerializedGameCollectionData> {
  const exportGameCollectionData = await runTransformPipeline(GAME_COLLECTION_EXPORT_PIPELINE, layer);
  const serializedGameCollectionData = await runTransformPipeline(GAME_COLLECTION_SERIALIZATION_PIPELINE, exportGameCollectionData);
  return serializedGameCollectionData;
}

/**
 * Updates the data bound to a game object layer.
 * @param layer - The game object to update.
 * @param update - The update data to apply.
 * @returns True if the update was successful, false otherwise.
 */
export async function updateGameObject(layer: ExportableLayer, update: PluginGameObjectData) {
  const result = await runUpdatePipeline(GAME_OBJECT_UPDATE_PIPELINE, layer, update);
  return result;
}

/**
 * Destroys an array of game objects, by removing bound game object data from the Figma layers.
 * @param layers - The game objects to destroy.
 */
export function removeGameObjects(layers: SceneNode[]) {
  layers.forEach(tryRemoveGameObject);
}

/**
 * Attempts to destroy a game object, by removing bound game object data from the Figma layer.
 * @param layer - The game object to destroy.
 */
function tryRemoveGameObject(layer: SceneNode) {
  if (isLayerData(layer)) {
    removeGameObject(layer);
  }
}

/**
 * Destroys a game object, by removing bound game object data from the Figma layer.
 * @param layer - The game object to destroy.
 */
export function removeGameObject(layer: DataLayer) {
  removePluginData(layer, "defoldGameObject");
  removePluginData(layer, "defoldSlice9");
}

/**
 * Infers game object data from an array of Figma layers.
 * @param layers - The Figma layers to infer data for.
 */
export function fixGameObjects(layers: SceneNode[]) {
  inferGameObjects(layers, true, true);
}
