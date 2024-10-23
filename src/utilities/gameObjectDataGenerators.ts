import config from "config/config.json";
import { vector4 } from "utilities/math";
import { getPluginData } from "utilities/figma";
import { convertGameCollectionData } from "utilities/gameObjectDataConverters";

/**
 * Generates options for exporting the root GUI node data.
 * @param layer - The Figma layer at the root.
 * @returns Options for exporting the root GUI node data.
 */
function generateRootOptions(layer: ExportableLayer): GameObjectDataExportOptions {
  return {
    layer,
    atRoot: true,
    namePrefix: "",
    parentId: "",
    parentSize: vector4(0),
    parentShift: vector4(-layer.x, -layer.y, 0, 0),
    parentChildren: []
  }
}

/**
 * Generates game object data for a given Figma layer, including textures.
 * @async
 * @param layer - The Figma layer to generate game object data for.
 * @returns Game object data.
 */
export async function generateGameCollectionData(layer: ExportableLayer): Promise<GameCollectionData> {
  const { name } = layer;
  const rootData = getPluginData(layer, "defoldGameObject");
  const rootOptions = generateRootOptions(layer);
  const collection = convertGameCollectionData(rootData);
  const nodes: GUINodeData[] = [];
  await generateGameObjectData(rootOptions, nodes);
  const collapsedNodes = nodes.map(collapseGameObjectData);
  const flatNodes = flattenGameObjectData(collapsedNodes);
  const textures: TextureData = {};
  await generateTexturesData(layer, textures);
  const filePath = rootData?.path || config.guiNodeDefaultSpecialValues.path;
  return {
    name,
    collection,
    nodes: flatNodes,
    textures,
    filePath
  };
}

export async function generateGameCollectionDataSet(layers: ExportableLayer[]): Promise<GameCollectionData[]> {
  const guiNodesDataSets = layers.map(generateGameCollectionData);
  return Promise.all(guiNodesDataSets);
}
