/**
 * Module for handling Defold GUI nodes in Figma.
 * @packageDocumentation
 */

import { generateGUIDataSet, generateGUIData } from "utilities/guiDataGenerators";
import { serializeGUIDataSet } from "utilities/guiDataSerializers";
import { getDefoldGUINodePluginData, fitParent, fitChildren } from "utilities/gui";
import { isFigmaText, getPluginData, setPluginData, removePluginData, tryUpdateLayerName, isFigmaComponentInstance, findMainComponent, isFigmaSceneNode, isAtlas, isFigmaFrame } from "utilities/figma";
import { tryRefreshSlice9Placeholder, isSlice9PlaceholderLayer, findOriginalLayer, parseSlice9Data } from "utilities/slice9";
import { tryRefreshScalePlaceholder } from "utilities/scale";
import { extractScheme } from "utilities/scheme";
import { inferTextNode, inferGUINodes } from "utilities/inference";

/**
 * Tries to restore slice 9 data for a given Figma layer.
 * @param layer - The layer to try restoring slice 9 data for.
 * TODO: Refactor actual restoration to a separate function.
 */
export function tryRestoreSlice9Node(layer: SceneNode) {
  const slice9 = parseSlice9Data(layer);
  if (slice9) {
    setPluginData(layer, { defoldSlice9: true });
    const data = getDefoldGUINodePluginData(layer);
    setPluginData(layer, { defoldGUINode: { ...data, slice9 } });
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
 * Serializes GUI nodes data for every given layer as ProtoText.
 * @param layers - The layers to serialize.
 * @returns An array of serialized GUI nodes data.
 */
export async function copyGUINodes(layers: ExportableLayer[]): Promise<SerializedGUIData[]> {
  const guiNodesData = await generateGUIDataSet(layers);
  const serializedGUINodesData = serializeGUIDataSet(guiNodesData);
  return serializedGUINodesData;
}

/**
 * Extracts GUI node scheme boilerplate code for a given layer.
 * @param layer - Figma layer to extract GUI node scheme from.
 * @returns Boilerplate code of the GUI node scheme.
 */
export async function copyGUINodeScheme(layer: ExportableLayer): Promise<string> {
  const guiNodesData = await generateGUIData(layer);
  const scheme = extractScheme(guiNodesData.nodes);
  return scheme;
}

/**
 * Exports GUI nodes data from an array of Figma layers and returns the serialized result.
 * @param layers - The layers to export GUI nodes data from.
 * @returns An array of serialized GUI nodes data.
 */
export async function exportGUINodes(layers: ExportableLayer[]): Promise<SerializedGUIData[]> {
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
      const { width, height, x, y } = layer;
      fitParent(parent, width, height, x, y);
      fitChildren(parent, x, y)
    }
  }
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

/**
 * Tries to extract a sprite image from an atlas component.
 * @param layer - The layer to try extracting an image from.
 * @returns The extracted image as a Uint8Array or null if extraction failed.
 * TODO: Move to atlas module.
 */
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
