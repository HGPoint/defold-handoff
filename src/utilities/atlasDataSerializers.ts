/**
 * Utility module for handling atlas data serialization.
 * @packageDocumentation
 */

import { propertySerializer } from "utilities/dataSerializers";
import { generateImageAssetsPath, generateSpritePath } from "utilities/path";

/**
 * Serializes image data for a single sprite.
 * @param data - Serialized data.
 * @param spriteData - Sprite data to be serialized.
 * @returns Serialized image data.
 */
function imageDataSerializer(data: string, { name, directory, sprite }: SpriteData) {
  const atlasImageAssetsPath = generateImageAssetsPath(directory);
  const image = generateSpritePath(atlasImageAssetsPath, name);
  const imageProperties = Object.entries(sprite).reduce(propertySerializer, "");
  return `${data}\nimages\n{\nimage:"${image}"\n${imageProperties}}`;
}

/**
 * Serializes image data for multiple sprites in an atlas.
 * @param images - Array of sprite data.
 * @returns Serialized image data for the entire atlas.
 */
function serializeAtlasImageData(images: SpriteData[]): string {
  return images.reduce(imageDataSerializer, "");
}

/**
 * Serializes atlas data.
 * @param atlasData - Atlas data to be serialized.
 * @returns Serialized atlas data.
 */
export function serializeAtlasData(atlasData: AtlasData): SerializedAtlasData {
  const { name, images } = atlasData;
  const atlas = Object.entries(atlasData.atlas).reduce(propertySerializer, "")
  const sprites = serializeAtlasImageData(images);
  const data = `${atlas}${sprites}`;
  return {
    name,
    data,
    images,
  };
}

/**
 * Serializes an array of atlas data.
 * @param atlasDataSet - Array of atlas data to be serialized.
 * @returns Array of serialized atlas data.
 */
export function serializeAtlasDataSet(atlasDataSet: AtlasData[]): SerializedAtlasData[] {
  return atlasDataSet.map(serializeAtlasData);
}
