import { generateGUIDataSet } from "utilities/guiDataGenerators";
import { serializeGUIDataSet } from "utilities/guiDataSerializers";
import { exportAtlases } from "handoff/atlas";
import { getPluginData, isAtlas, isAtlasSection, isFigmaSceneNode } from "utilities/figma";

function reduceAtlases(atlasIds: string[], defoldObject: GUIData) {
  const textureNames = Object.values(defoldObject.textures).map((texture) => texture.id);
  return atlasIds.concat(textureNames);
}

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

export async function exportBundle(layers: ExportableLayer[]): Promise<BundleData> {
  const guiNodesData = await generateGUIDataSet(layers);
  const serializedGUINodesData = serializeGUIDataSet(guiNodesData);
  const atlasIds = guiNodesData.reduce(reduceAtlases, []);
  const atlasLayers = await findAtlases(atlasIds);
  const serializedAtlasData = await exportAtlases(atlasLayers);
  return { gui: serializedGUINodesData, atlases: serializedAtlasData };
}
