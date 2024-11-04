/**
 * Utility module for handling Defold atlases.
 * @packageDocumentation
 */

import config from "config/config.json";
import { getPluginData, isFigmaSceneNode, isFigmaSection, isAtlas, isAtlasSection, isFigmaSlice } from "utilities/figma";

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
 * Compares two sprites by height.
 * @param sprite1 - The first sprite to compare.
 * @param sprite2 - The second sprite to compare.
 * @returns The result of comparison based on sprite heights.
 */
function sortSpritesByName(sprite1: SceneNode, sprite2: SceneNode) {
  return sprite1.name.localeCompare(sprite2.name);
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
  const sprites = [...atlas.children].sort(sortSpritesByName);
  sprites.forEach(sprite => {
    const { width, height } = sprite;
    if (height > currentRowHeight) {
      currentRowHeight = height;
    }
    if (maxWidth + width > atlas.width) {
      maxWidth = 0;
      maxHeight += currentRowHeight + config.atlasSpritePadding;
      currentRowHeight = height;
    }
    sprite.x = maxWidth;
    sprite.y = maxHeight;
    maxWidth += width + config.atlasSpritePadding;
  });
}

/**
 * Reduces an array of GUIData objects to an array of atlas IDs.
 * @param atlasIds - Accumulator array of atlas IDs.
 * @param data - GUIData object to extract atlas IDs from.
 * @returns An array of atlas IDs.
 */
export function reduceAtlases(atlasIds: (string | TextureDynamicAtlasSpritesData)[], data: GUIData | GameCollectionData) {
  const textureNames = Object.values(data.textures).reduce((textures, texture) => {
    if ("id" in texture) {
      textures.push(texture.id);
    }
    if ("sprites" in texture) {
      textures.push(texture.sprites);
    }
    return textures;
  }, [] as (string | TextureDynamicAtlasSpritesData)[]);
  return atlasIds.concat(textureNames);
}

/**
 * Finds atlas components based on their IDs including combined jumbo atlases.
 * @param textureAtlasesData - The IDs of the atlases to find.
 * @returns An array of found atlas components.
 */
export async function findAtlases(textureAtlasesData: (string | TextureDynamicAtlasSpritesData)[]): Promise<(ComponentSetNode | { atlasName: string, images: SliceNode[] })[]> {
  const atlases = [];
  for (const textureAtlasData of textureAtlasesData) {
    if (typeof textureAtlasData === "string") {
      const layer = await figma.getNodeByIdAsync(textureAtlasData);
      if (layer && isFigmaSceneNode(layer)) {
        if (isAtlas(layer)) {
          atlases.push(layer);
        } else if (isAtlasSection(layer)) {
          const sectionData = getPluginData(layer, "defoldSection");
          if (sectionData?.jumbo) {
            for (const child of layer.children) {
              if (isFigmaSceneNode(child) && isAtlas(child)) {
                atlases.push(child);
              }
            }
          }
        }
      }
    } else {
      const slices = {
        atlasName: textureAtlasData.atlasName,
        images: [] as SliceNode[],
      };
      for (const id of textureAtlasData.ids) {
        const layer = await figma.getNodeByIdAsync(id);
        if (layer && isFigmaSlice(layer)) {
          slices.images.push(layer);
        }
        atlases.push(slices);
      }
    }
  }
  return atlases;
}