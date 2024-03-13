import { setPluginData } from "../utilities/figma";

export function isDefoldAtlas(layer: SceneNode) {
  return layer.getPluginData("defoldAtlas") === "true";
}

function createAtlasSprite(layer: SceneNode) {
  const sprite = figma.createComponentFromNode(layer);
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
  setPluginData(atlas, { defoldAtlas: "true" });
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

async function exportAtlasSprite(sprite: SceneNode) {
  const data = await (sprite as ComponentNode).exportAsync({ format: "PNG" });
  const name = sprite.name.replace("Sprite=", "");
  return ({ name, data });
}

function exportDefoldAtlas(atlas: ComponentNode) {
  const { children } = atlas;
  const exportPromises = children.map(exportAtlasSprite);
  return Promise.all(exportPromises);
}

export function exportDefoldAtlases(atlas: ComponentNode[]) {
  const exportPromises = atlas.map(exportDefoldAtlas);
  return Promise.all(exportPromises);
}

export function removeDefoldAtlases(atlas: SceneNode[]) {
  figma.notify("Not implemented");
}
