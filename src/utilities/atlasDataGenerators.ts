/**
 * Utility module for generating atlas data.
 * @packageDocumentation
 */

import { convertAtlasData, convertSpriteData } from "utilities/atlasDataConverters";
import { calculateAtlasName } from "utilities/atlas";

/**
 * Generates sprite data from a Figma layer.
 * @param layer - The layer to generate sprite data from.
 * @param directory - The directory where sprite image is stored.
 * @returns The sprite data.
 */
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

/**
 * Generates atlas data from a Figma component set node that represents an atlas.
 * @param layer - The component set node to generate atlas data from.
 * @returns The atlas data.
 */
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

/**
 * Reducer function to accumulate info about combined atlases.
 * @param combinationData - The accumulated combined atlas data.
 * @param atlas - The atlas data.
 * @param index - The index of the atlas.
 * @returns The updated combined atlas.
 * TODO: Rename the function to something more appropriate.
 */
function combinationDataReducer(combinationData: Record<string, number[]>, atlas: AtlasData, index: number) {
  const { name } = atlas;
  if (combinationData[name]) {
    combinationData[name].push(index);
  } else {
    combinationData[name] = [index];
  }
  return combinationData;
}

/**
 * Reducer function to combine images from multiple atlases.
 * @param images - Accumulated images.
 * @param index - Index of the current atlas.
 * @param atlases - Array of the original atlas data.
 * @returns Combined images.
 */
function combinedAtlasReducer(images: SpriteData[], index: number, atlases: AtlasData[]) {
  const { images: spriteData } = atlases[index];
  return [...images, ...spriteData];
}

/**
 * Reducer function to combine multiple atlases based on combination data.
 * @param combinedAtlases - The accumulated combined atlas data.
 * @param combinedAtlasName - Name of the combined atlas.
 * @param atlasIndexes - Indexes of original atlases to be combined.
 * @param atlases - Array of original atlas data.
 * @returns Combined atlases.
 */
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

/**
 * Combines jumbo atlases into a single atlas.
 * @param atlases - The array of atlas data to process.
 * @returns The final atlas data set.
 * TODO: Rename the function to something more appropriate.
 */
function combineAtlases(atlases: AtlasData[]) {
  const combinationData = atlases.reduce(combinationDataReducer, {} as Record<string, number[]>);
  return Object.entries(combinationData).reduce((combinedAtlases, [combinedAtlasName, combinedAtlasIndexes]) => combinedAtlasesReducer(combinedAtlases, combinedAtlasName, combinedAtlasIndexes, atlases), [] as AtlasData[]);
}

/**
 * Generates atlas data set for an array of Figma component set nodes that represent atlases.
 * @param layers - The array of component set nodes to generate atlas data set from.
 * @returns The array of atlas data.
 */
export async function generateAtlasDataSet(layers: ComponentSetNode[]): Promise<AtlasData[]> {
  const exportPromises = layers.map(generateAtlasData);
  const atlases = await Promise.all(exportPromises);
  const combinedAtlases = combineAtlases(atlases);
  return combinedAtlases;
}
