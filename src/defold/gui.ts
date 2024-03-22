import { generateGUIDataSet } from "utilities/guiDataGenerators";
import { serializeGUIDataSet } from "utilities/guiDataSerializers";
import { setPluginData, removePluginData } from "utilities/figma";

function generateGUINodePluginData(layer: SceneNode): PluginData {
  const defoldGUINode = { id: layer.id };
  return {
    defoldGUINode
  };
}

export function createGUINode(layer: SceneNode): SceneNode {
  const componentData = generateGUINodePluginData(layer);
  setPluginData(layer, componentData);
  return layer;
}

export function createGUINodes(layers: SceneNode[]): SceneNode[] {
  return layers.map(createGUINode);
}

export async function copyGUINodes(layers: FrameNode[]): Promise<SerializedGUIData[]> {
  const guiNodesData = await generateGUIDataSet(layers);
  const serializedGUINodesData = serializeGUIDataSet(guiNodesData);
  return serializedGUINodesData;
}

export async function exportGUINodes(layers: FrameNode[]): Promise<SerializedGUIData[]> {
  const guiNodesData = await generateGUIDataSet(layers);
  const serializedGUINodesData = serializeGUIDataSet(guiNodesData);
  return serializedGUINodesData;
}

export function destroyGUINode(layer: SceneNode) {
  removePluginData(layer, ["defoldGUINode"]);
}

export function destroyGUINodes(layers: SceneNode[]) {
  layers.forEach(destroyGUINode);
}