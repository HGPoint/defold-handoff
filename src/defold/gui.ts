import { generateGUIDataSet } from "utilities/guiDataGenerators";
import { serializeGUIDataSet } from "utilities/guiDataSerializers";
import { getPluginData, setPluginData, removePluginData } from "utilities/figma";
import { refreshSlice9Placeholder } from "utilities/slice9";

export function updateGUINode(layer: SceneNode, data: PluginGUINodeData) {
  const pluginData = getPluginData(layer, "defoldGUINode");
  const guiNodeData = pluginData ? { defoldGUINode: { ...pluginData, ...data } } : { defoldGUINode: data };
  setPluginData(layer, guiNodeData);
  refreshSlice9Placeholder(layer, data.slice9)
}

export async function copyGUINodes(layers: ExportableLayer[]): Promise<SerializedGUIData[]> {
  const guiNodesData = await generateGUIDataSet(layers);
  const serializedGUINodesData = serializeGUIDataSet(guiNodesData);
  return serializedGUINodesData;
}

export async function exportGUINodes(layers: ExportableLayer[]): Promise<SerializedGUIData[]> {
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