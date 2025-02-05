/**
 * Handles atlas data conversion from Figma into Defold-like properties.
 * @packageDocumentation
 */

import { isFigmaText } from "utilities/figma";
import { injectAtlasDefaults, injectSpriteDefaults } from "utilities/defaults";

/**
 * Converts the atlas to a Defold-like data.
 * @returns Converted atlas data.
 */
export function convertAtlasData(): AtlasDefoldData {
  const defaults = injectAtlasDefaults();
  return {
    ...defaults,
  };
}

/**
 * Converts the sprite to a Defold-like data. 
 * @returns Converted sprite data.
 */
export function convertSpriteData(): SpriteDefoldData {
  const defaults = injectSpriteDefaults();
  return {
    ...defaults,
  };
}

export function convertSpriteName(layer: SceneNode): string {
  if (isFigmaText(layer)) {
    return convertTextSpriteName(layer);
  }
  return convertRegularSpriteName(layer);
}

function convertTextSpriteName(layer: TextNode) {
  const suffix = layer.characters
    .replace(/[<>:"/\\|?*\s]/g, '')
    .substring(0, 25)
    .trim()
    .replace(/\s+/g, "-");
  return `${layer.name}_${suffix}`;
}

function convertRegularSpriteName(layer: SceneNode) {
  return layer.name.replace("Sprite=", "");
}
