/**
 * Utility module for handling Defold GUI nodes.
 * @packageDocumentation
 */

import config from "config/config.json";
import { resolveAtlasTexture, resolveEmptyTexture } from "utilities/atlas";
import { getPluginData, findMainComponent, isExportable, isFigmaComponentInstance, isFigmaSceneNode, isAtlas } from "utilities/figma";
import { inferGUINodeType } from "utilities/inference";

/**
 * Checks if the given node type is a template type.
 * @param type - The type to check.
 * @returns True if the type is template, otherwise false.
 */
export function isTemplateGUINodeType(type: GUINodeType) {
  return type === "TYPE_TEMPLATE";
}

/**
 * Checks if the given node type is a text type.
 * @param type - The type to check.
 * @returns True if the type is text, otherwise false.
 */
export function isTextGUINodeType(type: GUINodeType) {
  return type === "TYPE_TEXT";
}

/**
 * Checks if the given node type is a box type.
 * @param type - The type to check.
 * @returns True if the type is box, otherwise false.
 */
export function isBoxGUINodeType(type: GUINodeType) {
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
 * Finds the texture for the given Figma layer.
 * @param layer - The Figma layer to find the texture for.
 * @returns The texture for the layer.
 */
export async function findTexture(layer: ExportableLayer) {
  if (isFigmaComponentInstance(layer)) {
    const mainComponent = await findMainComponent(layer);
    if (mainComponent) {
      const { parent } = mainComponent;
      if (isFigmaSceneNode(parent) && isAtlas(parent)) {
        return resolveAtlasTexture(parent, layer);
      }
    }
  }
  return resolveEmptyTexture();
}

/**
 * Retrieves the plugin data for a Figma layer representing a GUINode.
 * @param layer - The Figma scene node to retrieve plugin data from.
 * @returns The plugin data for the GUINode, with default values applied.
 */
export function getDefoldGUINodePluginData(layer: SceneNode) {
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
  }
}

/**
 * Resizes the parent frame to fit the given dimensions and shifts it by the given amount.
 * @param parent - The parent frame to resize.
 * @param layer - The layer to fit the parent to.
 */
export function fitParent(parent: FrameNode, layer: ExportableLayer) {
  const { width, height, x, y } = layer; 
  parent.resizeWithoutConstraints(width, height);
  parent.x += x;
  parent.y += y;
}

/**
 * Fits the children of the given frame node by shifting them by the given amount.
 * @param parent - The frame node to fit the children of.
 * @param layer - The layer to fit the children to.
 */
export function fitChildren(parent: FrameNode, layer: ExportableLayer) {
  const { x, y } = layer;
  for (const parentChild of parent.children) {
    if (isExportable(parentChild)) {
      parentChild.x -= x;
      parentChild.y -= y;
    }
  }
}