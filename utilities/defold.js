function setPluginData(layer, data) {
    for (const key in data) {
        layer.setPluginData(key, data[key].toString());
    }
}
export function isDefoldComponent(layer) {
    return layer.getPluginData('defoldComponent') === 'true';
}
export function createDefoldComponent(layer) {
    setPluginData(layer, { defoldComponent: 'true' });
}
export function createMultipleDefoldComponents(layers) {
    layers.forEach(createDefoldComponent);
}
export function removeDefoldComponent(defoldComponent) {
    defoldComponent.setPluginData('defoldComponent', '');
}
export function removeMultipleDefoldComponents(defoldComponents) {
    defoldComponents.forEach(removeDefoldComponent);
}
//# sourceMappingURL=defold.js.map