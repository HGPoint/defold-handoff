import { isDefoldComponent } from './defold';
function selectionReducer(selection, sceneNode) {
    if (sceneNode.type !== 'GROUP') {
        if (isDefoldComponent(sceneNode)) {
            selection.defoldComponents.push(sceneNode);
        }
        else {
            selection.figmaLayers.push(sceneNode);
        }
    }
    return selection;
}
export function reduceSelection() {
    return figma.currentPage.selection.reduce(selectionReducer, { defoldComponents: [], figmaLayers: [] });
}
export function isDefoldComponentSelected(selection) {
    return selection.defoldComponents.length === 1;
}
export function areMultipleDefoldComponentsSelected(selection) {
    return selection.defoldComponents.length > 1;
}
export function isFigmaLayerSelected(selection) {
    return selection.figmaLayers.length === 1;
}
export function areMultipleFigmaLayersSelected(selection) {
    return selection.figmaLayers.length > 1;
}
//# sourceMappingURL=figma.js.map