/**
 * Utility module for handling Defold GUI nodes.
 * @packageDocumentation
 */

import config from "config/config.json";
import { getPluginData, isExportable, isFigmaComponentInstance, isAtlasSprite, isFigmaText } from "utilities/figma";
import { inferGUINodeType } from "utilities/inference";

/**
 * An array containing keys of properties to be excluded during serialization.
 * @constant
 */
export const EXCLUDED_PROPERTY_KEYS = [
  "exclude",
  "screen",
  "skip",
  "fixed",
  "cloneable",
  "export_variants",
  "path",
  "template",
  "template_path",
  "template_name",
  "script",
  "script_path",
  "script_name",
  "wrapper",
  "wrapper_padding",
  "inferred",
  "exportable_layer",
  "exportable_layer_id",
  "exportable_layer_name",
  "figma_position",
  "figma_node_type",
  "children"
];

/**
 * An array containing keys of properties to be excluded during template serialization.
 * @constant
 */
export const EXCLUDED_TEMPLATE_PROPERTY_KEYS = [
  "visible",
  "text",
  "font",
  "outline",
  "shadow",
  "texture",
  "size_mode",
  "slice9",
  "material",
  "xanchor",
  "yanchor",
  "pivot",
  "adjust_mode",
  "clipping_mode",
  "clipping_visible",
  "clipping_inverted",
  "blend_mode",
  "custom_type",
  ...EXCLUDED_PROPERTY_KEYS,
];

/**
 * Checks if the given node type is a template type.
 * @param type - The type to check.
 * @returns True if the type is template, otherwise false.
 */
export function isGUITemplateNodeType(type: GUINodeType) {
  return type === "TYPE_TEMPLATE";
}

/**
 * Checks if the given node type is a text type.
 * @param type - The type to check.
 * @returns True if the type is text, otherwise false.
 */
export function isGUITextNodeType(type: GUINodeType) {
  return type === "TYPE_TEXT";
}

/**
 * Checks if the given node type is a box type.
 * @param type - The type to check.
 * @returns True if the type is box, otherwise false.
 */
export function isGUIBoxNodeType(type: GUINodeType) {
  return type === "TYPE_BOX";
}

/**
 * Checks if the given Figma layer is a template GUI node.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is a template GUI node, otherwise false.
 */
export function isTemplateGUINode(layer: ExportableLayer) {
  const pluginData = getPluginData(layer, "defoldGUINode");
  if (pluginData) {
    const { template } = pluginData;
    return template;
  }
  return false;
}

/**
 * Retrieves the plugin data for a Figma layer representing a GUINode.
 * @param layer - The Figma scene node to retrieve plugin data from.
 * @returns The plugin data for the GUINode, with default values applied.
 */
export function getGUINodePluginData(layer: SceneNode) {
  const pluginData = getPluginData(layer, "defoldGUINode");
  const id = pluginData?.id || layer.name;
  const type = pluginData?.type || inferGUINodeType(layer);
  const exportVariants = pluginData?.export_variants || "";
  return {
    ...config.guiNodeDefaultValues,
    ...config.guiNodeDefaultSpecialValues,
    ...pluginData,
    id,
    type,
    export_variants: exportVariants,
    figma_node_type: layer.type,
  }
}

/**
 * Resizes the parent frame to fit the given dimensions and shifts it by the given amount.
 * @param parent - The parent frame to resize.
 * @param layer - The layer to fit the parent to.
 */
export function fitParent(parent: BoxLayer, layer: ExportableLayer) {
  const { width, height, x, y } = layer; 
  parent.resizeWithoutConstraints(width, height);
  parent.x += x;
  parent.y += y;
  layer.x = 0;
  layer.y = 0;
}

/**
 * Fits the children of the given frame node by shifting them by the given amount.
 * @param parent - The frame node to fit the children of.
 * @param layer - The layer to fit the children to.
 * @param shiftX - The amount to shift the children on the x-axis.
 * @param shiftY - The amount to shift the children on the y-axis.
 */
export function fitChildren(parent: BoxLayer, layer: BoxLayer, shiftX: number, shiftY: number) {
  for (const parentChild of parent.children) {
    if (layer != parentChild && isExportable(parentChild)) {
      parentChild.x -= shiftX;
      parentChild.y -= shiftY;
    }
  }
}

/**
 * Fits the given child layer to the parent layer.
 * @param parent - The parent layer to fit the child to.
 * @param layer - The child layer to fit to the parent.
 */
export function fitChild(parent: BoxLayer, layer: BoxLayer) {
  const { width, height } = parent;
  layer.resizeWithoutConstraints(width, height);
  layer.x = 0;
  layer.y = 0;
}

/**
 * Checks if the plugin data was actually updated.
 * @async
 * @param pluginData - The current plugin data.
 * @param updatedPluginData - The updated plugin data.
 * @returns True if the plugin data is updated, otherwise false.
 */
async function isDataUpdated(pluginData: PluginGUINodeData, updatedPluginData: PluginGUINodeData) {
  const keys = Object.keys(updatedPluginData) as (keyof PluginGUINodeData)[];
  return keys.some((key) => JSON.stringify(pluginData[key]) !== JSON.stringify(updatedPluginData[key]));
}

/**
 * Checks if the GUI node plugin data should be updated on the layer.
 * @async
 * @param pluginData - The current plugin data.
 * @param updatedPluginData - The updated plugin data.
 * @returns True if the plugin data should be updated, otherwise false.
 */
export async function shouldUpdateGUINode(layer: SceneNode, pluginData: PluginGUINodeData | null | undefined, updatedPluginData: PluginGUINodeData) {
  if (!pluginData) {
    if (await isAtlasSprite(layer)) {
      return true;
    } else if (isFigmaComponentInstance(layer)) {
      return false;
    }
    return true;
  }
  return await isDataUpdated(pluginData, updatedPluginData);
}

export function resolvesGUINodeType(layer: ExportableLayer, pluginData: PluginGUINodeData | null | undefined): GUINodeType {
  if (isFigmaText(layer)) {
    return "TYPE_TEXT";
  }
  if (pluginData?.template) {
    return "TYPE_TEMPLATE";
  }
  return "TYPE_BOX";
}
