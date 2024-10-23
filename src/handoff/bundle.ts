/**
 * Module for handling bundled assets.
 * @packageDocumentation
 */

import { generateGUIDataSet } from "utilities/guiDataGenerators";
import { serializeGUIDataSet } from "utilities/guiDataSerializers";
import { reduceAtlases, findAtlases } from "utilities/gui";
import { exportAtlases } from "handoff/atlas";

/**
 * Exports GUI nodes, templates, associated atlases and graphic assets.
 * @param layers - Figma layers representing GUI nodes to export.
 * @returns A BundleData object containing serialized data for the GUI nodes and atlases.
 */
export async function exportBundle(layers: GUINodeExport[]): Promise<BundleData> {
  const guiNodesData = await generateGUIDataSet(layers);
  const serializedGUINodesData = serializeGUIDataSet(guiNodesData);
  const atlasIds = guiNodesData.reduce(reduceAtlases, []);
  const atlasLayers = await findAtlases(atlasIds);
  const serializedAtlasData = await exportAtlases(atlasLayers);
  return { gui: serializedGUINodesData, atlases: serializedAtlasData };
}
