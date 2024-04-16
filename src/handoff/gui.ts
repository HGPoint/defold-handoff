import { generateGUIDataSet, generateGUIData } from "utilities/guiDataGenerators";
import { serializeGUIDataSet } from "utilities/guiDataSerializers";
import { getDefoldGUINodePluginData } from "utilities/gui";
import { isFigmaText, getPluginData, setPluginData, removePluginData, tryUpdateLayerName, isFigmaComponentInstance, findMainComponent, isFigmaSceneNode, isAtlas } from "utilities/figma";
import { tryRefreshSlice9Placeholder, isSlice9PlaceholderLayer, findOriginalLayer, parseSlice9Data } from "utilities/slice9";
import { tryRefreshScalePlaceholder } from "utilities/scale";
import { extractScheme } from "utilities/scheme";
import { inferTextNode, inferGUINodes } from "utilities/inference";

export function tryRestoreSlice9Node(layer: SceneNode) {
  const slice9 = parseSlice9Data(layer);
  if (slice9) {
    setPluginData(layer, { defoldSlice9: true });
    const data = getDefoldGUINodePluginData(layer);
    setPluginData(layer, { defoldGUINode: { ...data, slice9 } });
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
    tryRefreshScalePlaceholder(layer, data.scale);
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

export async function tryExtractImage(layer: SceneNode): Promise<Uint8Array | null> {
  if (isFigmaComponentInstance(layer)) {
    const mainComponent = await findMainComponent(layer);
    if (mainComponent) {
      const { parent } = mainComponent;
      if (isFigmaSceneNode(parent) && isAtlas(parent)) {
        const { visible } = layer;
        layer.visible = true;
        const image = await layer.exportAsync({ format: "PNG" });
        layer.visible = visible;
        return image;
      }
    }
  }
  return null;
}
