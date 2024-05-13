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
  return {
    ...config.guiNodeDefaultValues,
    ...config.guiNodeDefaultSpecialValues,
    ...pluginData,
    id,
    type,
  }
}

/**
 * Resizes the parent frame to fit the given dimensions and shifts it by the given amount.
 * @param parent - The parent frame to resize.
 * @param width - The width of the child node to fit the parent to.
 * @param height - The height of the child node to fit the parent to.
 * @param shiftX - The amount to shift the parent to compensate for the child's position on the X axis.
 * @param shiftY - The amount to shift the parent to compensate for the child's position on the Y axis.
 */
export function fitParent(parent: FrameNode, width: number, height: number, shiftX: number, shiftY: number) {
  parent.resizeWithoutConstraints(width, height);
  parent.x += shiftX;
  parent.y += shiftY;
}

/**
 * Fits the children of the given frame node by shifting them by the given amount.
 * @param layer - The frame node to fit the children of.
 * @param shiftX - The amount to shift the children to compensate for the parent's shift on the X axis.
 * @param shiftY - The amount to shift the children to compensate for the parent's shift on the Y axis.
 */
export function fitChildren(layer: FrameNode, shiftX: number, shiftY: number) {
  for (const parentChild of layer.children) {
    if (isExportable(parentChild)) {
      if (parentChild.constraints.horizontal === "STRETCH" || parentChild.constraints.horizontal === "MIN") {
        parentChild.x -= shiftX;
      } else if (parentChild.constraints.horizontal === "MAX") {
        parentChild.x += shiftX;
      }
      if (parentChild.constraints.vertical === "STRETCH" || parentChild.constraints.vertical === "MIN") {
        parentChild.y -= shiftY;
      } else if (parentChild.constraints.vertical === "MAX") {
        parentChild.y += shiftY;
      }
    }
  }
}