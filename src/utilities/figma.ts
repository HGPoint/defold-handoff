import { isDefoldComponent } from "../defold/component";
import { isDefoldAtlas } from "../defold/atlas";

export function setPluginData(layer: SceneNode, data: Record<string, number | string | boolean>) {
  for (const key in data) {
    layer.setPluginData(key, data[key].toString());
  }
}

function selectionReducer(selection: SelectionData, sceneNode: SceneNode): SelectionData {
  if (sceneNode.type !== "GROUP") {
    if (isDefoldComponent(sceneNode)) {
      selection.defoldComponents.push(sceneNode);
    } else if (isDefoldAtlas(sceneNode)) {
      selection.defoldAtlases.push(sceneNode);
    } else {
      selection.figmaLayers.push(sceneNode);
    }
  }
  return selection;
}

export function reduceSelection(): SelectionData {
  return figma.currentPage.selection.reduce(selectionReducer, { defoldComponents: [], defoldAtlases: [], figmaLayers: [] });
}

export function isDefoldComponentSelected(selection: SelectionData) {
  return selection.defoldComponents.length === 1;
}

export function areMultipleDefoldComponentsSelected(selection: SelectionData) {
  return selection.defoldComponents.length > 1;
}

export function isFigmaLayerSelected(selection: SelectionData) {
  return selection.figmaLayers.length === 1;
}

export function areMultipleFigmaLayersSelected(selection: SelectionData) {
  return selection.figmaLayers.length > 1;
}

export function isDefoldAtlasSelected(selection: SelectionData) {
  return selection.defoldAtlases.length === 1;
}

export function areMultipleDefoldAtlasesSelected(selection: SelectionData) {
  return selection.defoldAtlases.length > 1;
}
