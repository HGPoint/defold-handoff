/**
 * Handles operations with default values for the Defold and special properties.
 * @packageDocumentation
 */

import config from "config/config.json";

/**
 * Retrieves default values for the sprite data from the configuration.
 * @returns Default values for the sprite data.
 */
export function injectSpriteDefaults() {
  return {
    ...config.atlasImageDefaultValues,
  };
}

/**
 * Retrieves default values for the atlas data from the configuration.
 * @returns Default values for the atlas data.
 */
export function injectAtlasDefaults() {
  return {
    ...config.atlasDefaultValues,
  };
}

/**
 * Retrieves default values for the collection data from the configuration.
 * @returns Default values for the collection data.
 */
export function injectGameCollectionDefaults() {
  return {
    ...config.gameCollectionDefaultValues
  };
}

/**
 * Retrieves default values for the base game object data from the configuration.
 * @returns Default values for the base game object data.
 */
export function injectEmptyComponentDefaults() {
  const { scale } = config.gameObjectDefaultValues;
  return {
    scale,
    ...config.gameObjectDefaultSpecialValues,
  };
}

/**
 * Retrieves default values for the sprite component data from the configuration.
 * @returns Default values for the sprite component data.
 */
export function injectSpriteComponentDefaults() {
  const { scale, size_mode, slice9, material, blend_mode } = config.gameObjectDefaultValues;
  return {
    scale,
    size_mode,
    slice9,
    material,
    blend_mode,
    ...config.gameObjectDefaultSpecialValues,
  };
}

/**
 * Retrieves default values for the label component data from the configuration.
 * @returns Default values for the label component data.
 */
export function injectLabelComponentDefaults() {
  const { scale, pivot, blend_mode } = config.gameObjectDefaultValues;
  return {
    scale,
    pivot,
    blend_mode,
    ...config.gameObjectDefaultSpecialValues,
  };
}

/**
 * Retrieves default values for the GUI data from the configuration.
 * @returns Default values for the GUI data.
 */
export function injectGUIDefaults() {
  return {
    ...config.guiDefaultValues
  };
}

/**
 * Retrieves default values for the GUI node data from the configuration.
 * @returns Default values for the GUI node data.
 */
export function injectGUINodeDefaults() {
  return {
    ...config.guiNodeDefaultValues,
    ...config.guiNodeDefaultSpecialValues
  };
}
