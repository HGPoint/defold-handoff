/**
 * Module for handling bundled assets.
 * @packageDocumentation
 */

import { generateGUIDataSet } from "utilities/guiDataGenerators";
import { serializeGUIDataSet } from "utilities/guiDataSerializers";
import { exportAtlases } from "handoff/atlas";
import { getPluginData, isAtlas, isAtlasSection, isFigmaSceneNode } from "utilities/figma";

/**
 * Reduces an array of GUIData objects to an array of atlas IDs.
 * @param atlasIds - Accumulator array of atlas IDs.
 * @param defoldObject - GUIData object to extract atlas IDs from.
 * @returns An array of atlas IDs.
 */
function reduceAtlases(atlasIds: string[], defoldObject: GUIData) {
  const textureNames = Object.values(defoldObject.textures).map((texture) => texture.id);
  return atlasIds.concat(textureNames);
}

/**
 * Finds atlas components based on their IDs including combined jumbo atlases.
 * @param atlasIds - The IDs of the atlases to find.
 * @returns An array of found atlas components.
 */
async function findAtlases(atlasIds: string[]): Promise<ComponentSetNode[]> {
  const atlases = [];
  for (const atlasId of atlasIds) {
    const layer = await figma.getNodeByIdAsync(atlasId);
    if (layer && isFigmaSceneNode(layer)) {
      if (isAtlas(layer)) {
        atlases.push(layer);
      } else if (isAtlasSection(layer)) {
        const sectionData = getPluginData(layer, "defoldSection");
        if (sectionData?.jumbo) {
          for (const child of layer.children) {
            if (isFigmaSceneNode(child) && isAtlas(child)) {
              atlases.push(child);
            }
          }
        }
      } 
    }
  }
  return atlases;
}

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
