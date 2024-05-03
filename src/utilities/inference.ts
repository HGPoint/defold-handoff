/**
 * Utility module for inferring GUINode properties from Figma layers.
  * @packageDocumentation
 */


import config from "config/config.json";
import { projectConfig } from "handoff/project";
import { findTexture } from "utilities/gui";
import { getPluginData, setPluginData, isFigmaBox, isFigmaText, hasFont } from "utilities/figma";
import { isSlice9Layer } from "utilities/slice9";
import { tryFindFont } from "utilities/font";

/**
 * Infers the GUINode type based on the Figma layer type.
 * @param layer - The Figma layer to infer the GUINode type for.
 * @returns The inferred GUINode type.
 */
export function inferGUINodeType(layer: SceneNode) {
  if (isFigmaText(layer)) {
    return "TYPE_TEXT";
  }
  return "TYPE_BOX";
}

/**
 * Infers the font for the given text layer.
 * @param layer - The text layer to infer the font for.
 * @returns The inferred font for the text layer.
 */
export function inferFont(layer: TextNode) {
  if (hasFont(layer.fontName)) {
    const { family: fontFamily } = layer.fontName;
    const foundFont = tryFindFont(fontFamily);
    if (foundFont) {
      return foundFont;
    }
    return projectConfig.fontFamilies[0];
  }
  return "";
} 

/**
 * Infers if the text node is visible.
 * @returns Always returns true.
 */
export function inferTextVisible(): boolean {
  return true;
}

/**
 * Infers the stroke weight for the text layer.
 * @param layer - The text layer to infer the stroke weight for.
 */
export function inferTextStrokeWeight(layer: TextNode) {
  if (typeof layer.fontSize === "number") {
    const strokeWeight = layer.fontSize * config.fontStrokeRatio;
    layer.strokeWeight = strokeWeight;
  }
}

/**
 * Infers the size mode for text layers.
 * @returns The inferred size mode, which is always 'SIZE_MODE_MANUAL'.
 */
export function inferTextSizeMode(): SizeMode {
  return "SIZE_MODE_MANUAL";
}

/**
 * Infers properties for a text node and sets plugin data.
 * @param layer - The text layer to infer properties for.
 */
export function inferTextNode(layer: TextNode) {
  const sizeMode = inferTextSizeMode();
  const visible = inferTextVisible();
  const font = inferFont(layer);
  const pluginData = getPluginData(layer, "defoldGUINode");
  const id = pluginData?.id || layer.name;
  const type = pluginData?.type || "TYPE_TEXT";
  const data = {
    ...config.guiNodeDefaultValues,
    ...config.guiNodeDefaultSpecialValues,
    ...pluginData,
    id,
    type,
    visible,
    size_mode: sizeMode,
    font,
  };
  setPluginData(layer, { defoldGUINode: data });
  inferTextStrokeWeight(layer);
}

/**
 * Infers if the box node is visible.
 * @param layer - The box layer to infer visibility for.
 * @param texture - The texture for the box layer.
 * @returns True if the box layer is visible, otherwise false.
 */
export function inferBoxVisible(layer: BoxLayer, texture?: string): boolean {
  return !!texture;
}

/**
 * Infers the size mode for a box node.
 * @param layer - The box layer to infer size mode for.
 * @param texture - The texture for the box layer.
 * @returns The inferred size mode for the box layer.
 */
export function inferBoxSizeMode(layer: BoxLayer, texture?: string): SizeMode {
  if (isSlice9Layer(layer)) {
    return "SIZE_MODE_MANUAL";
  }
  return texture ? "SIZE_MODE_AUTO" : "SIZE_MODE_MANUAL";
}

/**
 * Infers properties for a box node and sets plugin data.
 * @param layer - The box layer to infer properties for.
 */
export async function inferGUINode(layer: BoxLayer) {
  const texture = await findTexture(layer);
  const sizeMode = inferBoxSizeMode(layer, texture);
  const visible = inferBoxVisible(layer, texture);
  const pluginData = getPluginData(layer, "defoldGUINode");
  const id = pluginData?.id || layer.name;
  const type = pluginData?.type || "TYPE_TEXT";
  const data = {
    ...config.guiNodeDefaultValues,
    ...config.guiNodeDefaultSpecialValues,
    ...pluginData,
    id,
    type,
    visible,
    size_mode: sizeMode,
  };
  setPluginData(layer, { defoldGUINode: data });
}

/**
 * Infers properties for multiple GUI nodes.
 * @param layers - The array of Figma layers to infer properties for.
 */
export function inferGUINodes(layers: readonly SceneNode[]) {
  for (const layer of layers) {
    if (isFigmaBox(layer)) {
      inferGUINode(layer);
      if (layer.children) {
        inferGUINodes(layer.children);
      }
    } else if (isFigmaText(layer)) {
      inferTextNode(layer);
    }
  }
}
