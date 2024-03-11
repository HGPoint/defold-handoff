import { isDefoldComponent } from './defold';

function selectionReducer(selection: SelectionData, sceneNode: SceneNode): SelectionData {
  if (sceneNode.type !== 'GROUP') {
    if (isDefoldComponent(sceneNode)) {
      selection.defoldComponents.push(sceneNode);
    } else {
      selection.figmaLayers.push(sceneNode);
    }
  }
  return selection;
}

export function reduceSelection(): SelectionData {
  return figma.currentPage.selection.reduce(selectionReducer, { defoldComponents: [], figmaLayers: [] });
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
