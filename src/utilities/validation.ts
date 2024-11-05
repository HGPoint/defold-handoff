/**
 * Handles data and resource validation.
 * @packageDocumentation
 */

import config from "config/config.json";
import { isAtlasDynamic } from "utilities/atlas";

/**
 * Validates an array of atlases.
 * @param atlases - The atlases to validate.
 * @returns True if all atlases are valid, otherwise false.
 */
export function validateAtlases(atlases: AtlasLayer[]) {
  return atlases.every(validateAtlas);
}

/**
 * Validates an atlas.
 * @param atlas - The atlas to validate.
 * @returns True if the atlas is valid, otherwise false.
 */
export function validateAtlas(atlas: AtlasLayer) {
  try {
    if (isAtlasDynamic(atlas)) {
      return true;
    } else {
      return validateAtlasSize(atlas);
    }
  } catch (error) {
    const { name } = atlas;
    console.error(`Error validating atlas: ${name}`);
    console.error(error);
    return false;
  }
}

/**
 * Validates the size of an atlas. It should not exceed the maximum size defined in the configuration.
 * @param atlas - The atlas to validate the size of.
 * @returns True if the atlas size is valid, otherwise false.
 * @throws Will throw an error if the atlas size exceeds the maximum size.
 */
function validateAtlasSize(atlas: ComponentSetNode) {
  const atlasSize = calculateAtlasSize(atlas);
  const atlasMaxSize = calculateAtlasMaxSize();
  const isValid = atlasSize <= atlasMaxSize;
  if (!isValid) {
    throw new Error(`Atlas size exceeds maximum size: ${atlasSize} > ${atlasMaxSize}`);
  }
  return isValid;
}

/**
 * Calculates the maximum allowable size for an atlas based on the configuration.
 * @returns The maximum allowable size an atlas can have.
 */
function calculateAtlasMaxSize() {
  const { atlasMaxSize } = config;
  const maxSize = atlasMaxSize * atlasMaxSize;
  return maxSize;
}

/**
 * Calculates the total size of an atlas.
 * @param atlas - The atlas to calculate the size of.
 * @returns The total size of the atlas.
 */
function calculateAtlasSize(atlas: ComponentSetNode) {
  const size = atlas.children.reduce(atlasSizeReducer, 0);
  return size;
}

/**
 * Reducer function to calculate the cumulative size of an atlas.
 * @param size - The current cumulative size of the atlas.
 * @param sprite - The sprite to add to the cumulative size.
 * @returns The updated cumulative size of the atlas.
 */
function atlasSizeReducer(size: number, sprite: SceneNode) {
  const spriteSize = sprite.width * sprite.height;
  const updatedSize = size + spriteSize; 
  return updatedSize;
}