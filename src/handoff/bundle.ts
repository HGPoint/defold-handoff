/**
 * Provides endpoints for managing resource bundles, primarily focusing on export features.
 * @packageDocumentation
 */

import { exportGameCollectionAtlases, exportGUIAtlases } from "handoff/atlas";
import { exportGameCollections } from "handoff/gameCollection";
import { exportGUI } from "handoff/gui";
import { DEFAULT_PACK_OPTIONS } from "utilities/guiExport";

/**
 * Exports a bundle containing serialized GUI data, game collection data, and corresponding atlases from arrays of GUI node layers and game object layers.
 * @param layers - An object containing arrays of GUI node layers and game object layers to export.
 * @returns The serialized bundle data.
 */
export async function exportBundle(layers: { gui: Exclude<ExportableLayer, SliceLayer>[], gameObjects: Exclude<ExportableLayer, SliceLayer>[] }): Promise<BundleData> {
  const { gui, gameObjects } = layers;
  const serializedGUIData = await exportGUI(gui);
  const serializedGUIAtlasData = await exportGUIAtlases(gui, false, DEFAULT_PACK_OPTIONS);
  const serializedGameCollectionsData = await exportGameCollections(gameObjects);
  const serializedGameCollectionsAtlasData  = await exportGameCollectionAtlases(gameObjects);
  const bundle: BundleData = {
    gui: serializedGUIData,
    gameObjects: serializedGameCollectionsData,
    atlases: [ ...serializedGUIAtlasData, ...serializedGameCollectionsAtlasData ],
  };
  return bundle;
}

export async function exportBareBundle(layers: { gui: Exclude<ExportableLayer, SliceLayer>[], gameObjects: Exclude<ExportableLayer, SliceLayer>[] }): Promise<BundleData> {
  const { gui, gameObjects } = layers;
  const serializedGUIData = await exportGUI(gui);
  const serializedGUIAtlasData = await exportGUIAtlases(gui, true, DEFAULT_PACK_OPTIONS);
  const serializedGameCollectionsData = await exportGameCollections(gameObjects);
  const serializedGameCollectionsAtlasData = await exportGameCollectionAtlases(gameObjects);
  const bundle: BundleData = {
    gui: serializedGUIData,
    gameObjects: serializedGameCollectionsData,
    atlases: [ ...serializedGUIAtlasData, ...serializedGameCollectionsAtlasData ],
  };
  return bundle;
}
