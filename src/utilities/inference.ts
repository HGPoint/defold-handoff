import config from "config/config.json";
import { projectConfig } from "handoff/project";
import { findTexture } from "utilities/gui";
import { getPluginData, setPluginData, isFigmaBox, isFigmaText, hasFont } from "utilities/figma";
import { isSlice9Layer } from "utilities/slice9";
import { tryFindFont } from "utilities/font";

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

export function inferTextVisible(): boolean {
  return true;
}

export function inferTextStrokeWeight(layer: TextNode) {
  if (typeof layer.fontSize === "number") {
    const strokeWeight = layer.fontSize * config.fontStrokeRatio;
    layer.strokeWeight = strokeWeight;
  }
}

export function inferTextSizeMode(): SizeMode {
  return "SIZE_MODE_MANUAL";
}

export function inferTextNode(layer: TextNode) {
  const sizeMode = inferTextSizeMode();
  const visible = inferTextVisible();
  const font = inferFont(layer);
  const pluginData = getPluginData(layer, "defoldGUINode");
  const data = {
    ...pluginData,
    visible,
    size_mode: sizeMode,
    font,
  };
  setPluginData(layer, { defoldGUINode: data });
  inferTextStrokeWeight(layer);
}

export function inferBoxVisible(layer: BoxLayer, texture?: string): boolean {
  return !!texture;
}

export function inferBoxSizeMode(layer: BoxLayer, texture?: string): SizeMode {
  if (isSlice9Layer(layer)) {
    return "SIZE_MODE_MANUAL";
  }
  return texture ? "SIZE_MODE_AUTO" : "SIZE_MODE_MANUAL";
}

export async function inferGUINode(layer: BoxLayer) {
  const texture = await findTexture(layer);
  const sizeMode = inferBoxSizeMode(layer, texture);
  const visible = inferBoxVisible(layer, texture);
  const pluginData = getPluginData(layer, "defoldGUINode");
  const data = {
    ...pluginData,
    visible,
    size_mode: sizeMode,
  };
  setPluginData(layer, { defoldGUINode: data });
}

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
