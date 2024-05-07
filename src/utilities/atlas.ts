/**
 * Utility module for handling Defold atlases.
 * @packageDocumentation
 */

import { isFigmaSceneNode, isFigmaSection, getPluginData } from "utilities/figma";

/**
 * Resolves the final atlas name. If the atlas is part of a section that is to be combined as a single atlas, the name of the combined atlas is returned.
 * @param atlas - The atlas node for which the name is to be resolved.
 * @returns The resolved atlas name.
 */
export function resolveAtlasName(atlas: ComponentSetNode) {
  const section = atlas.parent;
  if (isFigmaSceneNode(section) && isFigmaSection(section)) {
    const combineAs = getPluginData(section, "defoldSection")?.jumbo
    if (combineAs) {
      return combineAs;
    }
  }
  return atlas.name;
}

/**
 * Resolves the texture property for a sprite within an atlas.
 * @param atlas - The atlas node containing the sprite.
 * @param layer - The sprite layer for which the texture property is to be resolved.
 * @returns The resolved texture property.
 */
export function resolveAtlasTexture(atlas: ComponentSetNode, layer: InstanceNode) {
  const atlasName = resolveAtlasName(atlas);
  const sprite = layer.variantProperties?.Sprite;
  return sprite ? `${atlasName}/${sprite}` : "";
}

/**
 * Resolves an empty texture property.
 * @returns The resolved texture property.
 */
export function resolveEmptyTexture() {
  return "";
}

/**
 * Compares two sprites by height.
 * @param sprite1 - The first sprite to compare.
 * @param sprite2 - The second sprite to compare.
 * @returns The result of comparison based on sprite heights.
 */
function sortSpritesByHeight(sprite1: SceneNode, sprite2: SceneNode) {
  return sprite2.height - sprite1.height;
}

/**
 * Packs sprites within the atlas node, arranging them to fit within the available space. Very simple sort from the tallest to the shortest sprite.
 * @param {ComponentSetNode} atlas - The atlas node containing sprites to be packed.
 * TODO: Implement a more usable sorting algorithm.
 */
export function packSprites(atlas: ComponentSetNode) {
  let maxHeight = 0;
  let maxWidth = 0;
  let currentRowHeight = 0;
  const sprites = [...atlas.children].sort(sortSpritesByHeight);
  sprites.forEach(sprite => {
    const { width, height } = sprite;
    if (height > currentRowHeight) {
      currentRowHeight = height;
    }
    if (maxWidth + width > atlas.width) {
      maxWidth = 0;
      maxHeight += currentRowHeight + 10; // TODO: Add gap config instead of hardcoded value.
      currentRowHeight = height;
    }
    sprite.x = maxWidth;
    sprite.y = maxHeight;
    maxWidth += width + 10; // TODO: Add gap config instead of hardcoded value.
  });
}