import config from "config/config.json";
import { calculateAtlasTexture, calculateEmptyTexture } from "utilities/atlas";
import { getPluginData, findMainComponent, isFigmaComponentInstance, isFigmaSceneNode, isAtlas } from "utilities/figma";
import { inferGUINodeType } from "utilities/inference";

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
