import { generateGUIDataSet } from "utilities/guiDataGenerators";
import { serializeGUIDataSet } from "utilities/guiDataSerializers";
import { getPluginData, setPluginData, removePluginData } from "utilities/figma";

export function updateGUINode(layer: SceneNode, data: PluginGUINodeData) {
  const pluginData = getPluginData(layer, "defoldGUINode");
  const guiNodeData = pluginData ? { defoldGUINode: { ...pluginData, ...data } } : { defoldGUINode: data };
  setPluginData(layer, guiNodeData);
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

export function resetGUINode(layer: SceneNode) {
  removePluginData(layer, ["defoldGUINode"]);
}

export function resetGUINodes(layers: SceneNode[]) {
  layers.forEach((layer) => { resetGUINode(layer) });
}