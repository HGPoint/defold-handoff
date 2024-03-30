import { convertAtlasData, convertSpriteData } from "utilities/atlasDataConverters";
import { calculateAtlasName } from "utilities/atlas";

async function generateAtlasSpriteData(layer: SceneNode, directory: string): Promise<SpriteData> {
  const sprite = convertSpriteData();
  const data = await layer.exportAsync({ format: "PNG" });
  const name = layer.name.replace("Sprite=", "");
  return {
    name,
    directory,
    sprite,
    data,
  };
}

async function generateAtlasData(layer: ComponentSetNode): Promise<AtlasData> {
  const { name: directory, children } = layer;
  const name = calculateAtlasName(layer);
  const atlas = convertAtlasData();
  const exportPromises = children.map((spriteData) => generateAtlasSpriteData(spriteData, directory));
  const images = await Promise.all(exportPromises);
  return {
    name,
    atlas,
    images,
  };
}

function combinationDataReducer(combinationData: Record<string, number[]>, atlas: AtlasData, index: number) {
  const { name } = atlas;
  if (combinationData[name]) {
    combinationData[name].push(index);
  } else {
    combinationData[name] = [index];
  }
  return combinationData;
}

function combinedAtlasReducer(images: SpriteData[], index: number, atlases: AtlasData[]) {
  const { images: spriteData } = atlases[index];
  return [...images, ...spriteData];
}

function combinedAtlasesReducer(combinedAtlases: AtlasData[], combineAtlasName: string , atlasIndexes: number[], atlases: AtlasData[]) {
  if (atlasIndexes.length === 1) {
    const [index] = atlasIndexes;
    combinedAtlases.push(atlases[index]);
  } else {
    const combinedAtlas = { name: combineAtlasName, atlas: convertAtlasData(), images: [] as SpriteData[] };
    combinedAtlas.images = atlasIndexes.reduce((images, index) => combinedAtlasReducer(images, index, atlases), [] as SpriteData[])
    combinedAtlases.push(combinedAtlas);
  }
  return combinedAtlases;
}

function combineAtlases(atlases: AtlasData[]) {
  const combinationData = atlases.reduce(combinationDataReducer, {} as Record<string, number[]>);
  return Object.entries(combinationData).reduce((combinedAtlases, [combinedAtlasName, combinedAtlasIndexes]) => combinedAtlasesReducer(combinedAtlases, combinedAtlasName, combinedAtlasIndexes, atlases), [] as AtlasData[]);
}

export async function generateAtlasDataSet(layers: ComponentSetNode[]): Promise<AtlasData[]> {
  const exportPromises = layers.map(generateAtlasData);
  const atlases = await Promise.all(exportPromises);
  const combinedAtlases = combineAtlases(atlases);
  return combinedAtlases;
}
