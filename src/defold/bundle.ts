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

export async function exportBundle(layers: FrameNode[]): Promise<BundleData> {
  const defoldObjectsSet = await generateGUIDataSet(layers);
  const gui = serializeGUIDataSet(defoldObjectsSet);
  const atlasIds = defoldObjectsSet.reduce(reduceAtlases, []);
  const atlasLayers = await findAtlases(atlasIds);
  const atlases = await exportAtlases(atlasLayers);
  return { gui, atlases };
}
