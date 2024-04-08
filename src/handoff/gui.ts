import { generateGUIDataSet, generateGUIData } from "utilities/guiDataGenerators";
import { serializeGUIDataSet } from "utilities/guiDataSerializers";
import { isFigmaText, getPluginData, setPluginData, removePluginData, tryUpdateLayerName } from "utilities/figma";
import { tryRefreshSlice9Placeholder, isSlice9PlaceholderLayer, findOriginalLayer, parseSlice9Data } from "utilities/slice9";
import { extractScheme } from "utilities/scheme";
import { inferTextNode, inferGUINodes } from "utilities/inference";

export function tryRefreshSlice9Sprite(layer: SceneNode) {
  const pluginData = getPluginData(layer, "defoldGUINode");
  if (pluginData) {
    tryRefreshSlice9Placeholder(layer, pluginData.slice9);
  }
}

export function tryRestoreSLice9Node(layer: SceneNode) {
  const slice9 = parseSlice9Data(layer);
  if (slice9) {
    setPluginData(layer, { defoldSlice9: true });
    setPluginData(layer, { defoldGUINode: { slice9 } });
  }
}

export function updateGUINode(layer: SceneNode, data: PluginGUINodeData) {
  const originalLayer = isSlice9PlaceholderLayer(layer) ? findOriginalLayer(layer) : layer;
  if (originalLayer) {
    const pluginData = getPluginData(originalLayer, "defoldGUINode");
    const guiNodeData = pluginData ? { defoldGUINode: { ...pluginData, ...data } } : { defoldGUINode: data };
    setPluginData(originalLayer, guiNodeData);
    tryUpdateLayerName(originalLayer, data.id);
    tryRefreshSlice9Placeholder(originalLayer, data.slice9)
  }
}

export async function copyGUINodes(layers: ExportableLayer[]): Promise<SerializedGUIData[]> {
  const guiNodesData = await generateGUIDataSet(layers);
  const serializedGUINodesData = serializeGUIDataSet(guiNodesData);
  return serializedGUINodesData;
}

export async function copyGUINodeScheme(layer: ExportableLayer): Promise<string> {
  const guiNodesData = await generateGUIData(layer);
  const scheme = extractScheme(guiNodesData.nodes);
  return scheme;
}

export async function exportGUINodes(layers: ExportableLayer[]): Promise<SerializedGUIData[]> {
  const guiNodesData = await generateGUIDataSet(layers);
  const serializedGUINodesData = serializeGUIDataSet(guiNodesData);
  return serializedGUINodesData;
}

export function fixGUINodes(layers: SceneNode[]) {
  inferGUINodes(layers);
}

export function fixTextNode(layer: SceneNode) {
  if (isFigmaText(layer)) {
    inferTextNode(layer);
  }
}

export function resetGUINode(layer: SceneNode) {
  removePluginData(layer, "defoldGUINode");
  removePluginData(layer, "defoldSlice9");
}

export function resetGUINodes(layers: SceneNode[]) {
  layers.forEach((layer) => { resetGUINode(layer) });
}