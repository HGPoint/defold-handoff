import { isFigmaComponent, setPluginData } from "../utilities/figma";

export function isDefoldAtlas(layer: SceneNode) {
  return layer.getPluginData("defoldAtlas");
}

function generateAtlasData(atlas: ComponentSetNode, data?: PluginUIMessagePayload) {
  const defoldAtlas = { id: atlas.id };
  return { defoldAtlas };
}

function createAtlasSprite(layer: SceneNode) {
  const sprite = isFigmaComponent(layer) ? (layer as ComponentNode) : figma.createComponentFromNode(layer);
  sprite.name = `Sprite=${layer.name}`;
  layer.locked = true;
  return sprite;
}

function createAtlasSprites(layers: SceneNode[]) {
  return layers.map(createAtlasSprite);
}

function createAtlas(sprites: ComponentNode[]) {
  const atlas = figma.combineAsVariants(sprites, figma.currentPage);
  atlas.name = "Atlas";
  const atlasData = generateAtlasData(atlas);
  setPluginData(atlas, atlasData);
  return atlas;
}

function styleAtlas(atlas: ComponentSetNode) {
  atlas.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  atlas.clipsContent = false;
  const bounds = atlas.absoluteRenderBounds;
  if (bounds !== null) {
    atlas.resizeWithoutConstraints(bounds.width, bounds.height);
  }
}

export function createDefoldAtlas(layers: SceneNode[]) {
  const sprites = createAtlasSprites(layers);
  const atlas = createAtlas(sprites);
  styleAtlas(atlas);
  figma.notify("Atlas created");
  return atlas;
}

export function updateDefoldAtlas(atlas: ComponentSetNode, data: PluginUIMessagePayload) {
  const atlasData = generateAtlasData(atlas, data);
  setPluginData(atlas, atlasData);
  figma.notify("Atlas updated");
  return atlas;
}

async function exportAtlasSprite(sprite: SceneNode): Promise<SpriteData> {
  const data = await (sprite as ComponentNode).exportAsync({ format: "PNG" });
  const name = sprite.name.replace("Sprite=", "");
  return ({ name, data });
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

export function exportDefoldAtlases(atlas: ComponentSetNode[]): Promise<AtlasData[]> {
  const exportPromises = atlas.map(exportDefoldAtlas);
  return Promise.all(exportPromises);
}

export function destroyDefoldAtlases(atlas: SceneNode[]) {
  figma.notify("Not implemented");
}
