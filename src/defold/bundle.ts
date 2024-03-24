import { generateGUIDataSet } from "utilities/guiDataGenerators";
import { serializeGUIDataSet } from "utilities/guiDataSerializers";
import { exportAtlases } from "defold/atlas";
import { isFigmaComponentSet } from "utilities/figma";

function reduceAtlases(atlasIds: string[], defoldObject: GUIData) {
  const textureNames = Object.values(defoldObject.textures).map((texture) => texture.id);
  return atlasIds.concat(textureNames);
}

async function findAtlases(atlasIds: string[]): Promise<ComponentSetNode[]> {
  const atlases = [];
  for (const atlasId of atlasIds) {
    const layer = await figma.getNodeByIdAsync(atlasId);
    if (!!layer && isFigmaComponentSet(layer)) {
      atlases.push(layer);
    }
  }
  return atlases;
}

export async function exportBundle(layers: ExportableLayer[]): Promise<BundleData> {
  const guiNodesData = await generateGUIDataSet(layers);
  const serializedGUINodesData = serializeGUIDataSet(guiNodesData);
  const atlasIds = guiNodesData.reduce(reduceAtlases, []);
  const atlasLayers = await findAtlases(atlasIds);
  const serializedAtlasData = await exportAtlases(atlasLayers);
  return { gui: serializedGUINodesData, atlases: serializedAtlasData };
}
