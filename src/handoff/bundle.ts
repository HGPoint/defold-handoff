/**
 * Module for handling bundled assets.
 * @packageDocumentation
 */

import { generateGUIDataSet } from "utilities/guiDataGenerators";
import { serializeGUIDataSet } from "utilities/guiDataSerializers";
import { generateGameCollectionDataSet } from "utilities/gameObjectDataGenerators";
import { serializeGameObjectDataSet } from "utilities/gameObjectDataSerializers"
import { reduceAtlases, findAtlases } from "utilities/atlas";
import { exportAtlases } from "handoff/atlas";

/**
 * Exports GUI nodes, templates, associated atlases and graphic assets.
 * @param layers - Figma layers representing GUI nodes to export.
 * @returns A BundleData object containing serialized data for the GUI nodes and atlases.
 */
export async function exportBundle(bundle: { gui: GUINodeExport[], gameObjects: ExportableLayer[] }): Promise<BundleData> {
  const { gui, gameObjects } = bundle;
  let serializedGUINodesData: SerializedGUIData[] = [];
  let serializedGameObjectsData: SerializedGameCollectionData[] = [];
  const serializedAtlasData: SerializedAtlasData[] = [];
  if (gui.length > 0) {
    const guiNodesData = await generateGUIDataSet(gui);
    serializedGUINodesData = serializeGUIDataSet(guiNodesData);
    const textureAtlasesData = guiNodesData.reduce(reduceAtlases, []);
    const atlasLayers = await findAtlases(textureAtlasesData);
    const atlases = await exportAtlases(atlasLayers);
    serializedAtlasData.push(...atlases);
  }
  if (gameObjects.length > 0) {
    const gameObjectsData = await generateGameCollectionDataSet(gameObjects);
    serializedGameObjectsData = serializeGameObjectDataSet(gameObjectsData);
    const textureAtlasesData = gameObjectsData.reduce(reduceAtlases, []);
    const atlasLayers = await findAtlases(textureAtlasesData);
    const atlases = await exportAtlases(atlasLayers);
    serializedAtlasData.push(...atlases);
  }
  return {
    gui: serializedGUINodesData,
    gameObjects: serializedGameObjectsData,
    atlases: serializedAtlasData
  };
}
