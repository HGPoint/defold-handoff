import { calculateAtlasTexture, calculateEmptyTexture } from "utilities/atlas";
import { findMainComponent, isFigmaComponentInstance, isFigmaSceneNode, isAtlas } from "utilities/figma";

export function isTemplateGUINode(type: GUINodeType) {
  return type === "TYPE_TEMPLATE";
}

export function isTextGUINode(type: GUINodeType) {
  return type === "TYPE_TEXT";
}

export function isBoxGUINode(type: GUINodeType) {
  return type === "TYPE_BOX";
}

export async function findTexture(layer: ExportableLayer) {
  if (isFigmaComponentInstance(layer)) {
    const mainComponent = await findMainComponent(layer);
    if (mainComponent) {
      const { parent } = mainComponent;
      if (isFigmaSceneNode(parent) && isAtlas(parent)) {
        return calculateAtlasTexture(parent, layer);
      }
    }
  }
  return calculateEmptyTexture();
}
