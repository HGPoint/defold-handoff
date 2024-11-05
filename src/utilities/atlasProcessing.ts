/**
 * Handles atlas data processing and transformation.
 * @packageDocumentation
 */

import { convertAtlasData } from "utilities/atlasConversion";

/**
 * Combines jumbo atlases into the single atlas.
 * @param atlases - The atlases to be combined.
 * @returns The combined atlases.
 */
export function combineAtlases(atlases: AtlasData[]) {
  const atlasCombinationData = generateAtlasCombinationData(atlases);
  const combinedAtlases = processAtlasCombinationData(atlasCombinationData, atlases);
  return combinedAtlases;
}

/**
 * Generates data for combining atlases.
 * @param atlases - The atlases to be combined.
 * @returns The data for combining atlases.
 */
function generateAtlasCombinationData(atlases: AtlasData[]) {
  return atlases.reduce(atlasCombinationDataReducer, {});
}

/**
 * Reducer function to accumulate data for the combined atlases.
 * @param combinationData - The cumulative data for the combined atlases.
 * @param atlas - The atlas data.
 * @param index - The index of the atlas.
 * @returns The updated cumulative data for the combined atlases.
 */
function atlasCombinationDataReducer(combinationData: Record<string, number[]>, atlas: AtlasData, index: number) {
  const { name } = atlas;
  if (combinationData[name]) {
    combinationData[name].push(index);
  } else {
    combinationData[name] = [index];
  }
  return combinationData;
}

/**
 * Processes the data for combining atlases.
 * @param atlasCombinationData - The data for combining atlases.
 * @param atlases - The atlases to be combined.
 * @returns The combined atlases.
 */
function processAtlasCombinationData(atlasCombinationData: Record<string, number[]>, atlases: AtlasData[]) {
  return Object.entries(atlasCombinationData).reduce((combinedAtlases, [combinedAtlasName, combinedAtlasIndexes]) => combinedAtlasReducer(combinedAtlases, combinedAtlasName, combinedAtlasIndexes, atlases), [] as AtlasData[])
}

/**
 * Reducer function that combines atlases.
 * @param combinedAtlases - The cumulative combined atlases.
 * @param combinedAtlasName - The name of the combined atlas.
 * @param atlasIndexes - The indexes of the original atlases.
 * @param atlases - The original atlases.
 * @returns The updated cumulative combined atlases.
 */
function combinedAtlasReducer(combinedAtlases: AtlasData[], combineAtlasName: string, atlasIndexes: number[], atlases: AtlasData[]) {
  if (atlasIndexes.length === 1) {
    const [ index ] = atlasIndexes;
    combinedAtlases.push(atlases[index]);
  } else {
    const name = combineAtlasName;
    const atlas = convertAtlasData();
    const images = combineAtlasSprites(atlasIndexes, atlases);
    const combinedAtlas: AtlasData = {
      name,
      atlas,
      images
    };
    combinedAtlases.push(combinedAtlas);
  }
  return combinedAtlases;
}

/**
 * Combines sprites from multiple atlases.
 * @param atlasIndexes - The indexes of the original atlases.
 * @param atlases - The original atlases.
 * @returns The combined sprites.
 */
function combineAtlasSprites(atlasIndexes: number[], atlases: AtlasData[]) {
  return atlasIndexes.reduce((atlasesImages, atlasIndex) => combinedAtlasSpriteReducer(atlasesImages, atlasIndex, atlases), [] as SpriteData[])
}

/**
 * Reducer function that combines sprites from multiple atlases.
 * @param atlasImages - The cumulative combined sprites.
 * @param atlasIndex - The index of the original atlas.
 * @param atlases - The original atlases.
 * @returns The updated cumulative combined sprites.
 */
function combinedAtlasSpriteReducer(atlasImages: SpriteData[], atlasIndex: number, atlases: AtlasData[]) {
  const { images } = atlases[atlasIndex];
  return [ ...atlasImages, ...images ];
}

/**
 * Spreads atlas groups into a set of atlases.
 * @param atlasLayerGroups - The atlas layer groups.
 * @returns The spread atlases.
 */
export function spreadAtlasGroups(atlasLayerGroups: AtlasLayer[][]): AtlasLayer[] {
  return atlasLayerGroups.reduce(atlasGroupSpreadReducer, [] as AtlasLayer[]);
}

/**
 * Reducer function that spreads atlas groups into a set of atlases.
 * @param atlasLayers - The cumulative set of atlases.
 * @param atlasLayerGroup - The atlas layer group.
 * @returns The updated cumulative set of atlases.
 */
function atlasGroupSpreadReducer(atlasLayers: AtlasLayer[], atlasLayerGroup: AtlasLayer[]) {
  return [ ...atlasLayers, ...atlasLayerGroup ];
}
