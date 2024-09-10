/**
 * Module for handling Defold atlases in Figma.
 * @packageDocumentation
 */

import config from "config/config.json";
import { generateAtlasDataSet } from "utilities/atlasDataGenerators";
import { serializeAtlasDataSet } from "utilities/atlasDataSerializers";
import { packSprites } from "utilities/atlas";
import { isFigmaComponentInstance, findMainComponent, isFigmaSceneNode, isAtlas } from "utilities/figma";
import { validateAtlases } from "utilities/validators";
import { setPluginData, isFigmaRemoved, isFigmaComponent, isFigmaComponentSet } from "utilities/figma";

/**
 * Fits a sprite component to its render bounds and re-positions it accordingly.
 * @param sprite - The sprite component to fit.
 */
function fitSpriteComponent(sprite: ComponentNode) {
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

/**
 * Creates a sprite component from a given Figma layer.
 * @param layer - Figma layer to create the sprite from.
 * @returns Sprite component.
 */
function createAtlasSpriteComponent(layer: SceneNode) {
  const sprite = figma.createComponentFromNode(layer);
  sprite.name = `Sprite=${sprite.name}`;
  sprite.fills = [];
  if (!isFigmaRemoved(layer)) {
    layer.locked = true;
  }
  fitSpriteComponent(sprite);
  return sprite;
}

/**
 * Creates sprite components from an array of (selected) Figma layers.
 * @param layers - Figma layers to create sprite components from.
 * @returns An array of sprite components.
 */
function createAtlasSpriteComponents(layers: SceneNode[]) {
  return layers.map(createAtlasSpriteComponent);
}

/**
 * Binds atlas data for a given Figma component set node.
 * @param layer - Figma layer to bind atlas data to.
 */
function createAtlasData(layer: ComponentSetNode) {
  const data = { id: layer.id };
  const atlasData = { defoldAtlas: data };
  setPluginData(layer, atlasData);
}

/**
 * Creates an atlas component from an array of sprite components. Sprites are combined as Figma component variants into the Figma component set node.
 * @param sprites - The sprite components to combine into an atlas.
 * @returns The atlas component.
 */
function createAtlasComponent(sprites: ComponentNode[]) {
  const atlas = figma.combineAsVariants(sprites, figma.currentPage);
  atlas.name = "atlas";
  createAtlasData(atlas);
  return atlas;
}

/**
 * Fits an atlas component to its render bounds.
 * @param atlas - The atlas component to fit.
 */
function fitAtlasComponent(atlas: ComponentSetNode) {
  const bounds = atlas.absoluteRenderBounds;
  if (bounds !== null) {
    atlas.resizeWithoutConstraints(bounds.width, bounds.height);
  }
}

/**
 * Creates a checkered pattern background for an atlas component.
 * @param atlas - The atlas component to create a background for.
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
 * Applies default styling to an atlas component.
 * @param atlas - The atlas component to style.
 */
async function styleAtlasComponent(atlas: ComponentSetNode) {
  atlas.clipsContent = false;
  fitAtlasComponent(atlas);
  await createAtlasBackground(atlas);
}

/**
 * Creates an atlas component from an array of Figma layers.
 * @param layers - Figma layers to create the atlas from.
 * @returns The atlas component.
 */
export function createAtlas(layers: SceneNode[]) {
  const sprites = createAtlasSpriteComponents(layers);
  const atlas = createAtlasComponent(sprites);
  styleAtlasComponent(atlas);
  return atlas;
}

/**
 * Appends a sprite component to an atlas component.
 * @param atlas - The atlas component to append the sprite component to.
 * @param sprite - Figma layer to append as a sprite component.
 * @param positionX - The x position to append the sprite component at.
 */
function appendSpriteComponent(atlas: ComponentSetNode, sprite: ComponentNode, positionX: number) {
  atlas.appendChild(sprite);
  sprite.x = positionX;
  sprite.y = atlas.height + config.atlasSpritePadding;
}

/**
 * Appends new sprite components to an atlas component. The atlas component is then fitted to include new sprite components.
 * @param atlas - The atlas component to append the sprite components to.
 * @param sprites - Figma layers to append as sprite components.
 */
function appendSpriteComponents(atlas: ComponentSetNode, sprites: ComponentNode[]) {
  let nextSpritePositionX = 0;
  sprites.forEach((sprite) => {
    appendSpriteComponent(atlas, sprite, nextSpritePositionX);
    nextSpritePositionX += sprite.width + config.atlasSpritePadding; 
  });
  fitAtlasComponent(atlas);
}

/**
 * Adds sprite components to an atlas component.
 * @param atlas - The atlas component to add the sprite components to.
 * @param layers - Figma layers to add as sprite components.
 */
export function addSprites(atlas: ComponentSetNode, layers: SceneNode[]) {
  const sprites = createAtlasSpriteComponents(layers);
  appendSpriteComponents(atlas, sprites);
}

/**
 * Exports serialized atlases from an array of atlas components.
 * @param atlases - The atlas components to export.
 * @returns An array of serialized atlas data.
 */
export async function exportAtlases(atlases: ComponentSetNode[], scale: number = 1): Promise<SerializedAtlasData[]> {
  if (validateAtlases(atlases)) {
    const atlasData = await generateAtlasDataSet(atlases, scale);
    const serializedAtlasData = serializeAtlasDataSet(atlasData);
    return serializedAtlasData;
  }
  return Promise.reject("Error exporting atlases");
}

/**
 * Destroys an atlas component.
 * @param atlas - The atlas component to destroy.
 */
export function destroyAtlas(atlas: ComponentSetNode) {
  setPluginData(atlas, { defoldAtlas: null });
}

/**
 * Destroys an array of atlas components.
 * @param atlases - The atlas components to destroy.
 */
export function destroyAtlases(atlases: ComponentSetNode[]) {
  atlases.forEach(destroyAtlas);
}

/**
 * Fixes the name of a sprite component.
 * @param sprite - The sprite component.
 */
function fixSpriteName(sprite: SceneNode) {
  const [ , name ] = sprite.name.split("=");
  if (name) {
    sprite.name = `Sprite=${name}`;
  }
}

/**
 * Fixes a sprite component. This includes fixing the sprite name and re-sizing the sprite component.
 * @param sprite - The sprite component to fix. 
 */
function fixSpriteComponent(sprite: SceneNode) {
  if (isFigmaComponent(sprite)) {
    fixSpriteName(sprite);
    const [ layer ] = sprite.children;
    if (!isFigmaRemoved(layer)) {
      layer.locked = true;
    }
    fitSpriteComponent(sprite);
  }
}

/**
 * Fixes an atlas component. This includes styling and fitting the atlas component, and fixing sprite components within the atlas.
 * @param atlas - The atlas component to fix.
 */
export function fixAtlas(atlas: ComponentSetNode) {
  styleAtlasComponent(atlas);
  fitAtlasComponent(atlas);
  atlas.children.forEach(fixSpriteComponent);
}

/**
 * Fixes an array of atlas components.
 * @param atlases - The atlas components to fix.
 */
export function fixAtlases(atlases: ComponentSetNode[]) {
  atlases.forEach(fixAtlas);
}

/**
 * Sorts sprites within an atlas component
 * @param atlas - The atlas component to sort.
 */
export function sortAtlas(atlas: ComponentSetNode) {
  packSprites(atlas);
}

/**
 * Sorts an array of atlas components.
 * @param atlases - The atlas components to sort.
 */
export function sortAtlases(atlases: ComponentSetNode[]) {
  atlases.forEach(sortAtlas);
}

/**
 * Fits an array of atlas components.
 * @param atlases - The atlas components to fit.
 */
export function fitAtlases(atlases: ComponentSetNode[]) {
  atlases.forEach(fitAtlasComponent);
}

/**
 * Tries to restore atlas data for a given Figma layer.
 * @param layer - Figma layer to try to restore atlas data for.
 */
export function tryRestoreAtlas(layer: SceneNode) {
  if (isFigmaComponentSet(layer)) {
    createAtlasData(layer);
  }
}

/**
 * Tries to restore atlas data for an array of Figma layers.
 * @param layers - Figma layers to try to restore atlas data for.
 */
export function tryRestoreAtlases(layers: SceneNode[]) {
  layers.forEach(tryRestoreAtlas);
}


/**
 * Tries to extract a sprite image from an atlas component.
 * @param layer - The layer to try extracting an image from.
 * @returns The extracted image as a Uint8Array or null if extraction failed.
 */
export async function tryExtractImage(layer: SceneNode): Promise<Uint8Array | null> {
  if (isFigmaComponentInstance(layer)) {
    const mainComponent = await findMainComponent(layer);
    if (mainComponent) {
      const { parent } = mainComponent;
      if (isFigmaSceneNode(parent) && isAtlas(parent)) {
        const { visible } = layer;
        layer.visible = true;
        const image = await layer.exportAsync({ format: "PNG" });
        layer.visible = visible;
        return image;
      }
    }
  }
  return null;
}
