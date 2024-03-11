function setPluginData(layer: SceneNode, data: Record<string, number | string | boolean>) {
  for (const key in data) {
    layer.setPluginData(key, data[key].toString());
  }
}

export function isDefoldComponent(layer: SceneNode) {
  return layer.getPluginData('defoldComponent') === 'true';
}

export function createDefoldComponent(layer: SceneNode) {
  setPluginData(layer, { defoldComponent: 'true' });
}

export function createMultipleDefoldComponents(layers: SceneNode[]) {
  layers.forEach(createDefoldComponent);
}

export function removeDefoldComponent(defoldComponent: SceneNode) {
  defoldComponent.setPluginData('defoldComponent', '');
}

export function removeMultipleDefoldComponents(defoldComponents: SceneNode[]) {
  defoldComponents.forEach(removeDefoldComponent);
}
