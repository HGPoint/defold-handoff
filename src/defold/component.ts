import { convertToDefoldObject, convertToDefoldComponents } from "../utilities/defold";

export function isDefoldComponent(layer: SceneNode) {
  return layer.getPluginData("defoldComponent");
}

export function createAdvancedDefoldComponent(layer: SceneNode) {
  return layer;
}

export function createAdvancedDefoldComponents(layers: SceneNode[]) {
  return layers.map(createAdvancedDefoldComponent);
}

export function copyComponentsToDefold(components: FrameNode[]) {
  const [component] = components;
  const defoldObject = convertToDefoldObject(component);
  const defoldComponent = convertToDefoldComponents(defoldObject);
  return Promise.resolve(defoldComponent);
}

export function exportComponentsToDefold(components: FrameNode[]) {
  const [ component ] = components;
  const defoldObject = convertToDefoldObject(component);
  const defoldComponent = convertToDefoldComponents(defoldObject);
  return Promise.resolve(defoldComponent);
}

export function destroyAdvancedDefoldComponent(defoldComponent: SceneNode) {
  defoldComponent.setPluginData("defoldComponent", "");
}

export function destroyAdvancedDefoldComponents(defoldComponents: SceneNode[]) {
  defoldComponents.forEach(destroyAdvancedDefoldComponent);
}