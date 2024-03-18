import { convertToDefoldObjects, convertSetToDefoldComponents } from "../utilities/defold";
import { exportDefoldAtlases } from "./atlas";

function reduceAtlases(atlasIds: string[], defoldObject: DefoldObject) {
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

export async function exportBundleToDefold(layers: FrameNode[]) {
  const defoldObjectsSet = await convertToDefoldObjects(layers);
  const components = convertSetToDefoldComponents(defoldObjectsSet);
  const atlasIds = defoldObjectsSet.reduce(reduceAtlases, []);
  const atlasLayers = await findAtlases(atlasIds);
  const atlases = await exportDefoldAtlases(atlasLayers);
  return { components, atlases };
}
