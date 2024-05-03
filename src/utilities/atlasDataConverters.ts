/**
 * Utility module for handling atlas data conversion.
 * @packageDocumentation
 */

import config from "config/config.json";

/**
 * Retrieves default values for sprite data from the configuration.
 * @returns Default values for sprite data.
 */
function injectSpriteDefaults() {
  return config.atlasImageDefaultValues;
}

/**
 * Converts sprite data from Figma properties, Plugin data and default values to SpriteComponentData.
 * @returns Converted sprite data.
 */
export function convertSpriteData(): SpriteComponentData {
  const defaults = injectSpriteDefaults();
  return {
    ...defaults,
  };
}

/**
 * Retrieves default values for atlas data from the configuration.
 * @returns Default values for atlas data.
 */
function injectAtlasDefaults() {
  return config.atlasDefaultValues;
}

/**
 * Converts atlas data from Figma properties, Plugin data and default values to AtlasComponentData.
 * @returns Converted atlas data.
 */
export function convertAtlasData(): AtlasComponentData {
  const defaults = injectAtlasDefaults();
  return {
    ...defaults,
  };
}
