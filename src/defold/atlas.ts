import { isFigmaComponent, setPluginData } from "../utilities/figma";

function generateAtlasData(atlas: ComponentSetNode) {
  const defoldAtlas = { id: atlas.id };
  return {
    defoldAtlas
  };
}

function createAtlasSpriteComponent(layer: SceneNode) {
  const sprite = isFigmaComponent(layer) ? layer : figma.createComponentFromNode(layer);
  sprite.name = `Sprite=${layer.name}`;
  sprite.locked = true;
  return sprite;
}

function createAtlasSpritesComponents(layers: SceneNode[]) {
  return layers.map(createAtlasSpriteComponent);
}

function createAtlasComponent(sprites: ComponentNode[]) {
  const atlas = figma.combineAsVariants(sprites, figma.currentPage);
  atlas.name = "Atlas";
  const atlasData = generateAtlasData(atlas);
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
  figma.notify("Atlas created");
  return atlas;
}

async function exportAtlasSprite(sprite: SceneNode): Promise<SpriteData> {
  const data = await (sprite as ComponentNode).exportAsync({ format: "PNG" });
  const name = sprite.name.replace("Sprite=", "");
  return {
    name,
    data
  };
}

async function exportDefoldAtlas(atlas: ComponentSetNode): Promise<AtlasData> {
  const { children } = atlas;
  const exportPromises = children.map(exportAtlasSprite);
  const sprites = await Promise.all(exportPromises);
  return {
    name: atlas.name,
    sprites,
  };
}

export function exportAtlases(atlases: ComponentSetNode[]): Promise<AtlasData[]> {
  const exportPromises = atlases.map(exportDefoldAtlas);
  return Promise.all(exportPromises);
}

export function destroyAtlases(atlases: SceneNode[]) {
  console.log(atlases);
  figma.notify("Not implemented");
}
