import { isDefoldComponent } from "../defold/component";
import { isDefoldAtlas } from "../defold/atlas";

export function isFigmaComponent(node: SceneNode) {
  return node.type === "COMPONENT";
}

export function isFigmaFrame(node: SceneNode) {
  return node.type === "FRAME";
}

export function setPluginData(layer: SceneNode, data: DefoldData) {
  for (const key in data) {
    layer.setPluginData(key, JSON.stringify(data[key as keyof DefoldData]));
  }
}

export function getPluginData<T>(layer: SceneNode, key: keyof DefoldData): T {
  const data = layer.getPluginData(key);
  return JSON.parse(data || "{}");
}

function selectionReducer(selection: SelectionData, sceneNode: SceneNode): SelectionData {
  if (sceneNode.type !== "GROUP") {
    if (isDefoldAtlas(sceneNode)) {
      selection.defoldAtlases.push(sceneNode as ComponentSetNode);
    } else if (isDefoldComponent(sceneNode) || isFigmaFrame(sceneNode)) {
      selection.defoldComponents.push(sceneNode as FrameNode);
    } else {
      selection.figmaLayers.push(sceneNode);
    }
  }
  return selection;
}

export function reduceSelection(): SelectionData {
  return figma.currentPage.selection.reduce(selectionReducer, { defoldComponents: [], defoldAtlases: [], figmaLayers: [] });
}

function generatePluginUISelectionAtlasData(defoldAtlas: ComponentSetNode): DefoldAtlasData {
  const data: DefoldAtlasData = JSON.parse(defoldAtlas.getPluginData("defoldAtlas") || "{}");
  data.id = defoldAtlas.id; 
  return data;
}

function generatePluginUISelectionComponentData(defoldComponent: SceneNode): DefoldComponentData {
  const data: DefoldComponentData = JSON.parse(defoldComponent.getPluginData("defoldComponent") || "{}");
  data.id = defoldComponent.id; 
  return data;
}

export function generatePluginUISelectionData(selection: SelectionData): PluginUISelectionData {
  const defoldComponents = selection.defoldComponents.map(generatePluginUISelectionComponentData);
  const defoldAtlases = selection.defoldAtlases.map(generatePluginUISelectionAtlasData);
  return { defoldComponents, defoldAtlases };
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
