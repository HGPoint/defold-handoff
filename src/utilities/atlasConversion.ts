/**
 * Handles atlas data conversion from Figma into Defold-like properties.
 * @packageDocumentation
 */

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
