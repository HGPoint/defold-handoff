import { generateAtlasDataSet } from "utilities/atlasDataGenerators";
import { serializeAtlasDataSet } from "utilities/atlasDataSerializers";
import { isFigmaComponent, setPluginData } from "utilities/figma";

function generateAtlasPluginData(atlas: ComponentSetNode) {
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
  const atlasData = generateAtlasPluginData(atlas);
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

export async function exportAtlases(atlases: ComponentSetNode[]): Promise<SerializedAtlasData[]> {
  const atlasData = await generateAtlasDataSet(atlases);
  const serializedAtlasData = serializeAtlasDataSet(atlasData);
  figma.notify("Atlases exported");
  return serializedAtlasData;
}

export function destroyAtlases(atlases: SceneNode[]) {
  console.log(atlases);
  figma.notify("Not implemented");
}
