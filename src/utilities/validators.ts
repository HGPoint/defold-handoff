import config from "config/config.json";

/**
 * Validates the size of an atlas. It should not exceed the maximum size defined in the config.
 * @param atlas – The atlas to validate.
 * @returns Whether the atlas size is valid.
 */
function validateAtlasSize(atlas: ComponentSetNode) {
  const atlasSize = atlas.children.reduce((size, sprite) => size + sprite.width * sprite.height, 0);
  const atlasMaxSize = config.atlasMaxSize * config.atlasMaxSize;
  if (atlasSize > atlasMaxSize) {
    throw new Error(`Atlas size exceeds maximum size: ${atlasSize} > ${atlasMaxSize}`);
  }
  return true;
}

/**
 * Validates an atlas.
 * @param atlas – The atlas to validate.
 * @returns Whether the atlas is valid.
 */
export function validateAtlas(atlas: ComponentSetNode) {
  try {
    return validateAtlasSize(atlas);
  } catch (error) {
    console.error(`Error validating atlas: ${atlas.name}`);
    console.error(error);
    return false;
  }
}

/**
 * Validates an array of atlases.
 * @param atlases – The array of atlases to validate.
 * @returns Whether all atlases are valid.
 */
export function validateAtlases(atlases: ComponentSetNode[]) {
  return atlases.every(validateAtlas);
}
