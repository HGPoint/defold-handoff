import { generateDefoldDataSet } from "../utilities/dataGenerators";
import { serializeDefoldDataSet } from "../utilities/dataSerializers";
import { exportAtlases } from "./atlas";

function reduceAtlases(atlasIds: string[], defoldObject: DefoldData) {
  const textureNames = Object.values(defoldObject.textures).map((texture) => texture.id);
  return atlasIds.concat(textureNames);
}

async function findAtlases(atlasIds: string[]): Promise<ComponentSetNode[]> {
  const atlases = [];
  for (const atlasName of atlasIds) {
    const atlas = await figma.getNodeByIdAsync(atlasName);
    if (atlas && atlas.type === "COMPONENT_SET") {
      atlases.push(atlas);
    }
  }
  return atlases;
}

export async function exportBundle(layers: FrameNode[]) {
  const defoldObjectsSet = await generateDefoldDataSet(layers);
  const components = serializeDefoldDataSet(defoldObjectsSet);
  const atlasIds = defoldObjectsSet.reduce(reduceAtlases, []);
  const atlasLayers = await findAtlases(atlasIds);
  const atlases = await exportAtlases(atlasLayers);
  return { components, atlases };
}
