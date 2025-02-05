/**
 * Handles operations with atlases.
 * @packageDocumentation
 */

import config from "config/config.json";
import { exportAtlasData } from "utilities/atlasExport";
import { serializeAtlasData } from "utilities/atlasSerialization";
import { completeAtlasData, ensureAtlasLayer, extractAtlasOriginalData, updateAtlasData } from "utilities/atlasUpdate";
import { findSectionWithContextData } from "utilities/context";
import { findMainFigmaComponent, getPluginData, isFigmaComponent, isFigmaComponentSet, isFigmaRemoved, isFigmaSceneNode, isFigmaSlice, isFigmaText, isLayerAtlas, isLayerContextSection, removePluginData, setPluginData } from "utilities/figma";

export const ATLAS_EXPORT_PIPELINE: TransformPipeline<AtlasExportPipelineData, AtlasData> = {
  transform: exportAtlasData,
};

export const ATLAS_SERIALIZATION_PIPELINE: TransformPipeline<AtlasData, SerializedAtlasData> = {
  transform: serializeAtlasData,
};

export const ATLAS_UPDATE_PIPELINE: UpdatePipeline<PluginAtlasData> = {
  ensureLayer: ensureAtlasLayer,
  extractOriginalData: extractAtlasOriginalData,
  beforeUpdate: completeAtlasData,
  update: updateAtlasData,
};

/**
 * Determines whether the atlas is a static atlas.
 * @param layer - The atlas to check.
 * @returns True if the atlas is a static atlas, otherwise false.
 */
export function isAtlasStatic(layer: AtlasLayer): layer is ComponentSetNode {
  return !isAtlasDynamic(layer);
}

/**
 * Determines whether the atlas is a dynamic atlas.
 * @param layer - The atlas to check.
 * @returns True if the atlas is a dynamic atlas, otherwise false.
 */
export function isAtlasDynamic(layer: AtlasLayer): layer is DynamicAtlas {
  return "name" in layer && "images" in layer && Array.isArray(layer.images);
}

export function getAtlasPluginData(layer: ComponentSetNode): PluginAtlasData {
  const pluginData = getPluginData(layer, "defoldAtlas");
  const id = pluginData?.id || layer.id;
  return {
    ...config.atlasDefaultSpecialValues,
    ...pluginData,
    id,
  }
}

/**
 * Resolves the name of the atlas.
 * @param atlas - The atlas to resolve the name for.
 * @returns The resolved name of the atlas.
 */
export function resolveAtlasName(atlas: AtlasLayer) {
  if (isAtlasDynamic(atlas)) {
    return atlas.name;
  }
  const contextSection = findSectionWithContextData(atlas);
  if (contextSection) {
    const atlasContextData = getPluginData(contextSection, "defoldSection")
    if (atlasContextData?.jumbo) {
      return atlasContextData.jumbo;
    }
  }
  return atlas.name;
}

/**
 * Finds atlases based on their Ids.
 * @param textureAtlasesData - The texture atlases data.
 * @returns The found atlases.
 */
export async function findAtlases(textureAtlasesData: (string | TextureDynamicAtlasSpritesData)[]): Promise<AtlasLayer[]> {
  const atlases = [];
  for (const textureAtlasData of textureAtlasesData) {
    if (typeof textureAtlasData === "string") {
      const layer = await figma.getNodeByIdAsync(textureAtlasData);
      if (layer) {
        if (isLayerAtlas(layer)) {
          atlases.push(layer);
        } else if (isLayerContextSection(layer)) {
          const sectionData = getPluginData(layer, "defoldSection");
          if (sectionData?.jumbo) {
            for (const child of layer.children) {
              if (isFigmaSceneNode(child) && isLayerAtlas(child)) {
                atlases.push(child);
              }
            }
          }
        }
      }
    } else {
      const dynamicAtlas = {
        name: textureAtlasData.atlasName,
        images: [] as (SliceNode | TextNode)[],
      };
      for (const id of textureAtlasData.ids) {
        const layer = await figma.getNodeByIdAsync(id);
        if (layer && (isFigmaSlice(layer) || isFigmaText(layer))) {
          dynamicAtlas.images.push(layer);
        }
      }
      atlases.push(dynamicAtlas);
    }
  }
  return atlases;
}

/**
 * Reduces atlas ids from texture data.
 * @param textures - The texture data.
 * @returns The reduced atlas ids.
 */
export function reduceAtlasIdsFromResources(textures: TextureResourceData) {
  return Object.values(textures).reduce(atlasIdReducer, [] as (string | TextureDynamicAtlasSpritesData)[]);
}

/**
 * Reducer function that collects atlas ids from texture data.
 * @param textures - The cumulative atlas ids.
 * @returns The updated cumulative atlas ids.
 */
function atlasIdReducer(textures: (string | TextureDynamicAtlasSpritesData)[], texture: TextureAtlasData) {
  if ("id" in texture && !texture.ignore) {
    textures.push(texture.id);
  }
  if ("sprites" in texture) {
    textures.push(texture.sprites);
  }
  return textures;
}

/**
 * Creates the atlas component from a set of sprites.
 * @param sprites - The sprites to create the atlas from.
 * @returns The created atlas Figma layer.
 */
export function createAtlasLayer(sprites: ComponentNode[]) {
  const atlas = figma.combineAsVariants(sprites, figma.currentPage);
  atlas.name = "atlas";
  createAtlasData(atlas);
  styleAtlas(atlas);
  return atlas;
}

/**
 * Creates atlas plugin data for the atlas.
 * @param layer - The atlas to create and bind the plugin data to.
 */
function createAtlasData(layer: ComponentSetNode) {
  const data = {
    ...config.atlasDefaultSpecialValues,
    id: layer.id
  };
  const atlasData = { defoldAtlas: data };
  setPluginData(layer, atlasData);
}

/**
 * Attempts to restore atlas data for the atlas.
 * @param layer - The atlas to restore the data for.
 */
export function tryRestoreAtlasLayer(layer: SceneNode) {
  if (isFigmaComponentSet(layer)) {
    createAtlasData(layer);
  }
}

/**
 * Removes the atlas plugin data from the atlas.
 * @param layer - The atlas to remove the plugin data from.
 */
export function removeAtlas(layer: DataLayer) {
  removePluginData(layer, "defoldAtlas");
}

/**
 * Applies styling to the atlas layer.
 * @param atlas - The atlas to style.
 */
async function styleAtlas(atlas: ComponentSetNode) {
  atlas.clipsContent = false;
  await createAtlasBackground(atlas);
}

/**
 * Creates a checkered pattern background for the atlas.
 * @param atlas - The atlas to create the background for.
 */
async function createAtlasBackground(atlas: ComponentSetNode) {
  const frame = figma.createFrame();
  frame.resize(2, 2);
  frame.fills = [{ type: "SOLID", color: { r: 0.70, g: 0.73, b: 0.75 } }];
  const rectTopLeft = figma.createRectangle();
  rectTopLeft.resize(1, 1);
  rectTopLeft.fills = [{ type: "SOLID", color: { r: 0.56, g: 0.57, b: 0.59 } }];
  rectTopLeft.x = 0;
  rectTopLeft.y = 0;
  frame.appendChild(rectTopLeft);
  const rectBottomRight = figma.createRectangle();
  rectBottomRight.resize(1, 1);
  rectBottomRight.fills = [{ type: "SOLID", color: { r: 0.56, g: 0.57, b: 0.59 } }];
  rectBottomRight.x = 1;
  rectBottomRight.y = 1;
  frame.appendChild(rectBottomRight);
  const bytes = await frame.exportAsync({ format: "PNG" });
  const fillImage = figma.createImage(bytes);
  atlas.fills = [{ type: "IMAGE", scaleMode: "TILE", scalingFactor: 15, imageHash: fillImage.hash }];
  frame.remove();
}

/**
 * Fixes the atlas component.
 * @param layer - The atlas to fix.
 */
export function fixAtlas(layer: ComponentSetNode) {
  styleAtlas(layer);
  fitAtlas(layer);
  fixSprites(layer);
}

/**
 * Fits the atlas to its render bounds.
 * @param atlas - The atlas to fit.
 */
export function fitAtlas(atlas: ComponentSetNode) {
  const bounds = atlas.absoluteRenderBounds;
  if (bounds !== null) {
    const { width: atlasWidth, height: atlasHeight } = atlas;
    const { width, height } = bounds;
    const fittedWidth = width > atlasWidth ? width + config.atlasPadding : atlasWidth;
    const fittedHeight = height > atlasHeight ? height + config.atlasPadding : atlasHeight;
    atlas.resizeWithoutConstraints(fittedWidth, fittedHeight);
  }
}

/**
 * Creates the sprites from a set of Figma layers.
 * @param layers - The Figma layers to create the sprites from.
 * @returns The created sprite components.
 */
export function createSpriteLayers(layers: SceneNode[]) {
  return layers.map(createSpriteLayer);
}

/**
 * Creates the sprite component from the Figma layer.
 * @param layer - The Figma layer to create the sprite from.
 * @returns The created sprite component.
 */
export function createSpriteLayer(layer: SceneNode) {
  const sprite = figma.createComponentFromNode(layer);
  sprite.name = `Sprite=${sprite.name}`;
  sprite.fills = [];
  lockSprite(sprite);
  fitSprite(sprite);
  return sprite;
}

/**
 * Appends the sprites to the atlas.
 * @param atlas - The atlas to append the sprites to.
 * @param sprites - The sprites to append.
 */
export function appendSprites(atlas: ComponentSetNode, sprites: ComponentNode[]) {
  let nextSpritePositionX = 0;
  sprites.forEach((sprite) => {
    appendSprite(atlas, sprite, nextSpritePositionX);
    nextSpritePositionX += sprite.width + config.atlasSpritePadding;
  });
  fitAtlas(atlas);
}

/**
 * Appends a sprite component to an atlas component.
 * @param atlas - The atlas component to append the sprite component to.
 * @param sprite - Figma layer to append as a sprite component.
 * @param positionX - The x position to append the sprite component at.
 */
function appendSprite(atlas: ComponentSetNode, sprite: ComponentNode, positionX: number) {
  atlas.appendChild(sprite);
  sprite.x = positionX;
  sprite.y = atlas.height + config.atlasSpritePadding;
}

/**
 * Determines whether the Figma layer can be extracted as a sprite.
 * @param layer - The Figma layer to check.
 * @returns True if the Figma layer can be extracted as a sprite, otherwise false.
 */
export async function canExtractSprite(layer: InstanceNode) {
  const mainComponent = await findMainFigmaComponent(layer);
  if (mainComponent) {
    const { parent } = mainComponent;
    return !!parent && isLayerAtlas(parent);
  }
  return false;
}

/**
 * Extracts the sprite from the Figma layer.
 * @param layer - The Figma layer to extract the sprite from.
 * @returns The extracted sprite image.
 */
export async function extractSprite(layer: InstanceNode) {
  const { visible } = layer;
  layer.visible = true;
  const image = await layer.exportAsync({ format: "PNG" });
  layer.visible = visible;
  return image;
}

/**
 * Packs sprites within the atlas node, arranging them to fit within the available space.
 * @param atlas - The atlas to pack sprites within.
 * TODO: Implement a more usable sorting algorithm.
 */
export function distributeSprites(atlas: ComponentSetNode) {
  let maxHeight = config.atlasPadding;
  let maxWidth = config.atlasPadding;
  let currentRowHeight = 0;
  const sprites = [...atlas.children]
  sprites.sort(sortSpritesByName);
  sprites.forEach(sprite => {
    const { width, height } = sprite;
    if (height > currentRowHeight) {
      currentRowHeight = height;
    }
    if (maxWidth + width > atlas.width) {
      maxWidth = config.atlasPadding;
      maxHeight += currentRowHeight + config.atlasSpritePadding;
      currentRowHeight = height;
    }
    sprite.x = maxWidth;
    sprite.y = maxHeight;
    maxWidth += width + config.atlasSpritePadding;
  });
}

/**
 * Sorts sprites based on their names.
 * @param sprite1 - The first sprite to compare.
 * @param sprite2 - The second sprite to compare.
 * @returns The comparison result.
 */
function sortSpritesByName(sprite1: SceneNode, sprite2: SceneNode) {
  return sprite1.name.localeCompare(sprite2.name);
}

/**
 * Fixes the sprites within the atlas.
 * @param layer - The atlas to fix the sprites within.
 */
function fixSprites(layer: ComponentSetNode) {
  layer.children.forEach(tryFixSprite);
}

/**
 * Attempts to fix the sprite.
 * @param layer - The Figma layer to fix.
 */
function tryFixSprite(layer: SceneNode) {
  if (isFigmaComponent(layer)) {
    fixSprite(layer);
  }
}

/**
 * Fixes the sprite.
 * @param sprite - The sprite to fix.
 */
function fixSprite(sprite: ComponentNode) {
  fixSpriteName(sprite);
  lockSprite(sprite);
  fitSprite(sprite);
}

/**
 * Fixes the name of the sprite.
 * @param sprite - The sprite to fix the name for.
 */
function fixSpriteName(sprite: ComponentNode) {
  const [ , name ] = sprite.name.split("=");
  if (name) {
    sprite.name = `Sprite=${name}`;
  }
}

/**
 * Locks the sprite.
 * @param sprite - The sprite to lock.
 */
function lockSprite(sprite: ComponentNode) {
  const [ layer ] = sprite.children;
  if (!isFigmaRemoved(layer)) {
    layer.locked = true;
  }
}

/**
 * Fits the sprite to its render bounds.
 * @param sprite - The sprite to fit.
 */
function fitSprite(sprite: ComponentNode) {
  const renderBounds = sprite.absoluteRenderBounds;
  const boxBounds = sprite.absoluteBoundingBox;
  if (renderBounds !== null && boxBounds !== null) {
    const { x: prevX, y: prevY } = boxBounds;
    const { width: newWidth, height: newHeight, x: newX, y: newY } = renderBounds;
    const changePositionX = Math.floor((newX - prevX));
    const changePositionY = Math.floor((newY - prevY));
    sprite.resizeWithoutConstraints(newWidth, newHeight)
    sprite.children.forEach(child => {
      child.x -= changePositionX;
      child.y -= changePositionY;
    });
  }
}
