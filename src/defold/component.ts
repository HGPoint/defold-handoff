import { setPluginData } from "../utilities/figma";

export function isDefoldComponent(layer: SceneNode) {
  return layer.getPluginData("defoldComponent") === "true";
}

export function createDefoldComponent(layer: SceneNode) {
  setPluginData(layer, { defoldComponent: "true" });
  return layer;
}

export function createDefoldComponents(layers: SceneNode[]) {
  return layers.map(createDefoldComponent);
}

export function exportDefoldComponents(defoldComponents: SceneNode[]) {
  figma.notify("Not implemented");
}

export function removeDefoldComponent(defoldComponent: SceneNode) {
  defoldComponent.setPluginData("defoldComponent", "");
}

export function removeDefoldComponents(defoldComponents: SceneNode[]) {
  defoldComponents.forEach(removeDefoldComponent);
}