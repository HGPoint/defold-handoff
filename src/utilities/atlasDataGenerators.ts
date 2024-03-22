import { convertAtlasData, convertSpriteData } from "utilities/atlasDataConverters";

async function generateAtlasSpriteData(layer: SceneNode): Promise<SpriteData> {
  const sprite = convertSpriteData();
  const data = await layer.exportAsync({ format: "PNG" });
  const name = layer.name.replace("Sprite=", "");
  return {
    name,
    sprite,
    data,
  };
}

async function generateAtlasData(layer: ComponentSetNode): Promise<AtlasData> {
  const { name, children } = layer;
  const atlas = convertAtlasData();
  const exportPromises = children.map(generateAtlasSpriteData);
  const images = await Promise.all(exportPromises);
  return {
    name,
    atlas,
    images,
  };
}

export async function generateAtlasDataSet(layers: ComponentSetNode[]): Promise<AtlasData[]> {
  const exportPromises = layers.map(generateAtlasData);
  const atlasData = await Promise.all(exportPromises);
  return atlasData;
}
