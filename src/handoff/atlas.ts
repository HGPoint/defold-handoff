import { generateAtlasDataSet } from "utilities/atlasDataGenerators";
import { serializeAtlasDataSet } from "utilities/atlasDataSerializers";
import { packSprites } from "utilities/atlas";
import { setPluginData, isFigmaRemoved, isFigmaComponent, isFigmaComponentSet } from "utilities/figma";

function fitSpriteComponent(sprite: ComponentNode) {
  const bounds = sprite.absoluteRenderBounds;
  if (bounds !== null) {
    const prevWidth = sprite.width;
    const prevHeight = sprite.height;
    sprite.resizeWithoutConstraints(bounds.width, bounds.height)
    const changeWidth = sprite.width - prevWidth;
    const changeHeight = sprite.height - prevHeight;
    sprite.children.forEach(child => {
      child.x += changeWidth / 2;
      child.y += changeHeight / 2;
    });
  }
}

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

function createAtlasSpriteComponents(layers: SceneNode[]) {
  return layers.map(createAtlasSpriteComponent);
}

function createAtlasData(layer: ComponentSetNode) {
  const data = { id: layer.id };
  const atlasData = { defoldAtlas: data };
  setPluginData(layer, atlasData);
}

function createAtlasComponent(sprites: ComponentNode[]) {
  const atlas = figma.combineAsVariants(sprites, figma.currentPage);
  atlas.name = "atlas";
  createAtlasData(atlas);
  return atlas;
}

function fitAtlasComponent(atlas: ComponentSetNode) {
  const bounds = atlas.absoluteRenderBounds;
  if (bounds !== null) {
    atlas.resizeWithoutConstraints(bounds.width, bounds.height);
  }
}

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

async function styleAtlasComponent(atlas: ComponentSetNode) {
  atlas.clipsContent = false;
  fitAtlasComponent(atlas);
  await createAtlasBackground(atlas);
}

export function createAtlas(layers: SceneNode[]) {
  const sprites = createAtlasSpriteComponents(layers);
  const atlas = createAtlasComponent(sprites);
  styleAtlasComponent(atlas);
  return atlas;
}

function appendSpriteComponents(atlas: ComponentSetNode, sprites: ComponentNode[]) {
  sprites.forEach((sprite) => { atlas.appendChild(sprite); });
  fitAtlasComponent(atlas);
}

export function addSprites(atlas: ComponentSetNode, layers: SceneNode[]) {
  const sprites = createAtlasSpriteComponents(layers);
  appendSpriteComponents(atlas, sprites);
}

export async function exportAtlases(atlases: ComponentSetNode[]): Promise<SerializedAtlasData[]> {
  const atlasData = await generateAtlasDataSet(atlases);
  const serializedAtlasData = serializeAtlasDataSet(atlasData);
  return serializedAtlasData;
}

export function destroyAtlas(atlas: ComponentSetNode) {
  setPluginData(atlas, { defoldAtlas: null });
}

export function destroyAtlases(atlases: ComponentSetNode[]) {
  atlases.forEach(destroyAtlas);
}

function fixSpriteName(sprite: SceneNode) {
  const [ , name ] = sprite.name.split("=");
  if (name) {
    sprite.name = `Sprite=${name}`;
  }
}

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

export function fixAtlas(atlas: ComponentSetNode) {
  styleAtlasComponent(atlas);
  fitAtlasComponent(atlas);
  atlas.children.forEach(fixSpriteComponent);
}

export function fixAtlases(atlases: ComponentSetNode[]) {
  atlases.forEach(fixAtlas);
}

export function sortAtlas(atlas: ComponentSetNode) {
  packSprites(atlas);
}

export function sortAtlases(atlases: ComponentSetNode[]) {
  atlases.forEach(sortAtlas);
}

export function fitAtlases(atlases: ComponentSetNode[]) {
  atlases.forEach(fitAtlasComponent);
}

export function tryRestoreAtlas(layer: SceneNode) {
  if (isFigmaComponentSet(layer)) {
    createAtlasData(layer);
  }
} 

export function tryRestoreAtlases(layers: SceneNode[]) {
  layers.forEach(tryRestoreAtlas);
}
