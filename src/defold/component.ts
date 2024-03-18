import { convertToDefoldObjects, convertSetToDefoldComponents } from "../utilities/defold";

export function isDefoldComponent(layer: SceneNode) {
  return !!layer.getPluginData("defoldComponent");
}

export function createAdvancedDefoldComponent(layer: SceneNode) {
  return layer;
}

export function createAdvancedDefoldComponents(layers: SceneNode[]) {
  return layers.map(createAdvancedDefoldComponent);
}

export async function copyComponentsToDefold(layers: FrameNode[]) {
  const defoldObjectsSet = await convertToDefoldObjects(layers);
  const defoldComponents = convertSetToDefoldComponents(defoldObjectsSet);
  return defoldComponents;
}

export async function exportComponentsToDefold(layers: FrameNode[]) {
  const defoldObjectsSet = await convertToDefoldObjects(layers);
  const defoldComponents = convertSetToDefoldComponents(defoldObjectsSet);
  return defoldComponents;
}

export function destroyAdvancedDefoldComponent(layer: SceneNode) {
  layer.setPluginData("defoldComponent", "");
}

export function destroyAdvancedDefoldComponents(layer: SceneNode[]) {
  layer.forEach(destroyAdvancedDefoldComponent);
}
