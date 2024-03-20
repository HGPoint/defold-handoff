import { generateDefoldDataSet } from "../utilities/dataGenerators";
import { serializeDefoldDataSet } from "../utilities/dataSerializers";
import { setPluginData, removePluginData } from "../utilities/figma";

function generateGUINodeData(layer: SceneNode) {
  const defoldGUINode = { id: layer.id };
  return {
    defoldGUINode
  };
}

export function createGUINode(layer: SceneNode) {
  const componentData = generateGUINodeData(layer);
  setPluginData(layer, componentData);
  return layer;
}

export function createGUINodes(layers: SceneNode[]) {
  return layers.map(createGUINode);
}

export function destroyGUINode(layer: SceneNode) {
  removePluginData(layer, ["defoldGUINode"]);
}

export function destroyGUINodes(layers: SceneNode[]) {
  layers.forEach(destroyGUINode);
}

export async function copyGUINodesToDefold(layers: FrameNode[]) {
  const guiNodesData = await generateDefoldDataSet(layers);
  const guiNodes = serializeDefoldDataSet(guiNodesData);
  return guiNodes;
}

export async function exportGUINodesToDefold(layers: FrameNode[]) {
  const guiNodesData = await generateDefoldDataSet(layers);
  const guiNodes = serializeDefoldDataSet(guiNodesData);
  return guiNodes;
}
