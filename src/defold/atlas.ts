import { generateAtlasDataSet } from "utilities/atlasDataGenerators";
import { serializeAtlasDataSet } from "utilities/atlasDataSerializers";
import { setPluginData, isFigmaRemoved } from "utilities/figma";

function createAtlasSpriteComponent(layer: SceneNode) {
  const sprite = figma.createComponentFromNode(layer);
  sprite.name = `Sprite=${sprite.name}`;
  sprite.fills = [];
  if (!isFigmaRemoved(layer)) {
    layer.locked = true;
  }
  const bounds = sprite.absoluteRenderBounds;
  if (bounds !== null) {
    const prevWidth  = sprite.width;
    const prevHeight = sprite.height;
    sprite.resizeWithoutConstraints(bounds.width, bounds.height)
    const changeWidth  = sprite.width - prevWidth;
    const changeHeight = sprite.height - prevHeight;
    sprite.children.forEach(child => {
      child.x += changeWidth / 2;
      child.y += changeHeight / 2;
    });
  }
  return sprite;
}

function createAtlasSpritesComponents(layers: SceneNode[]) {
  return layers.map(createAtlasSpriteComponent);
}

function createAtlasComponent(sprites: ComponentNode[]) {
  const atlas = figma.combineAsVariants(sprites, figma.currentPage);
  atlas.name = "atlas";
  const data = { id: atlas.id };
  const atlasData = { defoldAtlas: data };
  setPluginData(atlas, atlasData);
  return atlas;
}

function styleAtlasComponent(atlas: ComponentSetNode) {  
  atlas.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  atlas.clipsContent = false;
  const bounds = atlas.absoluteRenderBounds;
  if (bounds !== null) {
    atlas.resizeWithoutConstraints(bounds.width, bounds.height);
  }
}

export function createAtlas(layers: SceneNode[]) {
  const sprites = createAtlasSpritesComponents(layers);
  const atlas = createAtlasComponent(sprites);
  styleAtlasComponent(atlas);
  return atlas;
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
