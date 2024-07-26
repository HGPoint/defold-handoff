/**
 * Module for handling Defold GUI nodes in Figma.
 * @packageDocumentation
 */

import { generateGUIDataSet, generateGUIData } from "utilities/guiDataGenerators";
import { serializeGUIData, serializeGUIDataSet } from "utilities/guiDataSerializers";
import { fitParent, fitChildren, shouldUpdateGUINode } from "utilities/gui";
import { isFigmaText, getPluginData, setPluginData, removePluginData, tryUpdateLayerName, isFigmaFrame, isFigmaBox, isFigmaComponentInstance, isFigmaComponent } from "utilities/figma";
import { restoreSlice9Node, tryRefreshSlice9Placeholder, isSlice9PlaceholderLayer, findOriginalLayer, parseSlice9Data, isSlice9Layer, findPlaceholderLayer } from "utilities/slice9";
import { tryRefreshScalePlaceholder } from "utilities/scale";
import { extractScheme } from "utilities/scheme";
import { inferTextNode, inferGUINodes } from "utilities/inference";
import { projectConfig } from "handoff/project";

/**
 * Tries to restore slice 9 data for a given Figma layer.
 * @param layer - The layer to try restoring slice 9 data for.
 */
export async function tryRestoreSlice9Node(layer: SceneNode) {
  const originalLayer = isSlice9PlaceholderLayer(layer) ? findOriginalLayer(layer) : layer;
  if (originalLayer) {
    const slice9 = parseSlice9Data(originalLayer);
    if (slice9) {
      restoreSlice9Node(originalLayer, slice9);
      await tryRefreshSlice9Placeholder(originalLayer, slice9);
    }
  }
}

/**
 * Updates bound GUI node data for a given layer. Tries refresh slice 9 and scale placeholders.
 * @param layer - The layer to update GUI node data for.
 * @param data - Updated GUI node data.
 */
export async function updateGUINode(layer: SceneNode, data: PluginGUINodeData) {
  const originalLayer = isSlice9PlaceholderLayer(layer) ? findOriginalLayer(layer) : layer;
  if (originalLayer) {
    const pluginData = getPluginData(originalLayer, "defoldGUINode");
    const updatedPluginData: PluginGUINodeData = { ...pluginData, ...data };
    if (await shouldUpdateGUINode(layer, pluginData, updatedPluginData)) {
      const guiNodeData = { defoldGUINode: { ...pluginData, ...data } };
      setPluginData(originalLayer, guiNodeData);
      tryUpdateLayerName(originalLayer, data.id);
      tryRefreshSlice9Placeholder(originalLayer, data.slice9, pluginData?.slice9)
      tryRefreshScalePlaceholder(layer, data.scale, pluginData?.scale);
    }
  }
}

/**
 * Serializes GUI node data for a given layer as ProtoText.
 * @param layers - The layers to serialize.
 * @returns An array of serialized GUI nodes data.
 */
export async function copyGUINode(layer: GUINodeExport): Promise<SerializedGUIData> {
  const guiNodeData = await generateGUIData(layer);
  const serializedGUINodeData = serializeGUIData(guiNodeData);
  return serializedGUINodeData;
}

/**
 * Extracts GUI node scheme boilerplate code for a given layer.
 * @param layer - Figma layer to extract GUI node scheme from.
 * @returns Boilerplate code of the GUI node scheme.
 */
export async function copyGUINodeScheme(layer: GUINodeExport): Promise<string> {
  const guiNodesData = await generateGUIData(layer);
  const scheme = extractScheme(guiNodesData.nodes);
  return scheme;
}

/**
 * Exports GUI nodes data from an array of Figma layers and returns the serialized result.
 * @param layers - The layers to export GUI nodes data from.
 * @returns An array of serialized GUI nodes data.
 */
export async function exportGUINodes(layers: GUINodeExport[]): Promise<SerializedGUIData[]> {
  const guiNodesData = await generateGUIDataSet(layers);
  const serializedGUINodesData = serializeGUIDataSet(guiNodesData);
  return serializedGUINodesData;
}

/**
 * Infers properties for the GUI nodes from the properties of Figma layers.
 * @param layers - Figma layers to infer GUI properties from.
 */
export function fixGUINodes(layers: SceneNode[]) {
  inferGUINodes(layers);
}

/**
 * Matches parent of the GUI node to the dimensions of the GUI node.
 * @param layer - The GUI node to match parent for.
 */
export function matchGUINodes(layer: ExportableLayer) {
  if (isFigmaBox(layer)) {
    const realLayer = isSlice9Layer(layer) ? findPlaceholderLayer(layer) : layer;
    if (realLayer) {
      const { parent } = realLayer;
      if (parent && isFigmaBox(parent)) {
        const { x, y } = realLayer;
        fitParent(parent, realLayer);
        fitChildren(parent, realLayer, x ,y)
      }
    }
  }
}

/**
 * Resizes GUI nodes to the dimensions of the screen.
 * @param layers - The layers to resize.
 */
export function resizeScreenNodes(layers: SceneNode[]) {
  const { screenSize: { x: screenWidth, y: screenHeight } } = projectConfig;
  layers.forEach((layer) => {
    if (isFigmaFrame(layer) || isFigmaComponent(layer)) {
      layer.resize(screenWidth, screenHeight);
    }
  });
}

/**
 * Infers properties for the text node from the properties of the Figma layer.
 * @param layer - The text node to fix.
 */
export function fixTextNode(layer: SceneNode) {
  if (isFigmaText(layer)) {
    inferTextNode(layer);
  }
}

/**
 * Removes override GUI node data for a given Figma layer.
 * @param layer - Figma layer to remove override GUI node data for.
 */
function removeGUINodeOverride(layer: SceneNode) {
  const { root: document } = figma;
  const key: PluginDataOverrideKey = `defoldGUINodeOverride-${layer.id}`;
  removePluginData(document, key);
}  

/**
 * Removes bound GUI node data for a given Figma layer.
 * @param layer - Figma layer to reset GUI node data for.
 */
export function removeGUINode(layer: SceneNode) {
  removePluginData(layer, "defoldGUINode");
  removePluginData(layer, "defoldSlice9");
  if (isFigmaComponentInstance(layer)) {
    removeGUINodeOverride(layer);
  }
}

/**
 * Removes bound GUI node data for an array of Figma layers.
 * @param layers - Figma layers to reset GUI nodes for.
 */
export function removeGUINodes(layers: SceneNode[]) {
  layers.forEach((layer) => { removeGUINode(layer) });
}

/**
 * Pulls GUI node data from the main component for a given Figma component instance layer.
 * @param layer - The layer to pull GUI node data for.
 */
function pullFromMainComponentLayer(layer: SceneNode) {
  if (isFigmaComponentInstance(layer)) {
    removePluginData(layer, "defoldGUINode");
    removeGUINodeOverride(layer);
  }
}

/**
 * Pulls GUI node data from the main component for each Figma layer from an array.
 * @param layers - The layers to pull GUI node data for.
 */
export function pullFromMainComponent(layers: SceneNode[]) {
  layers.map(pullFromMainComponentLayer);
}
