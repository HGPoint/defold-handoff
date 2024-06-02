/**
 * Module for handling Defold GUI nodes in Figma.
 * @packageDocumentation
 */

import { generateGUIDataSet, generateGUIData } from "utilities/guiDataGenerators";
import { serializeGUIData, serializeGUIDataSet } from "utilities/guiDataSerializers";
import { fitParent, fitChildren } from "utilities/gui";
import { isFigmaText, getPluginData, setPluginData, removePluginData, tryUpdateLayerName, isFigmaComponentInstance, isFigmaFrame } from "utilities/figma";
import { restoreSlice9Node, tryRefreshSlice9Placeholder, isSlice9PlaceholderLayer, findOriginalLayer, parseSlice9Data } from "utilities/slice9";
import { tryRefreshScalePlaceholder } from "utilities/scale";
import { extractScheme } from "utilities/scheme";
import { inferTextNode, inferGUINodes } from "utilities/inference";
import { projectConfig } from "handoff/project";

/**
 * Tries to restore slice 9 data for a given Figma layer.
 * @param layer - The layer to try restoring slice 9 data for.
 */
export function tryRestoreSlice9Node(layer: SceneNode) {
  const slice9 = parseSlice9Data(layer);
  if (slice9) {
    restoreSlice9Node(layer, slice9);
  }
}

/**
 * Updates bound GUI node data for a given layer. Tries refresh slice 9 and scale placeholders.
 * @param layer - The layer to update GUI node data for.
 * @param data - Updated GUI node data.
 */
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
  if (isFigmaFrame(layer) || isFigmaComponentInstance(layer)) {
    const { parent } = layer;
    if (parent && isFigmaFrame(parent)) {
      fitParent(parent, layer);
      fitChildren(parent, layer)
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
    if (isFigmaFrame(layer)) {
      layer.resizeWithoutConstraints(screenWidth, screenHeight);
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
 * Removes bound GUI node data for a given Figma layer.
 * @param layer - Figma layer to reset GUI node data for.
 */
export function removeGUINode(layer: SceneNode) {
  removePluginData(layer, "defoldGUINode");
  removePluginData(layer, "defoldSlice9");
}

/**
 * Removes bound GUI node data for an array of Figma layers.
 * @param layers - Figma layers to reset GUI nodes for.
 */
export function removeGUINodes(layers: SceneNode[]) {
  layers.forEach((layer) => { removeGUINode(layer) });
}
