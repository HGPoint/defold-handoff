/**
 * Handles atlas data serialization.
 * @packageDocumentation
 */

import { serializeProperties, serializeProperty } from "utilities/dataSerialization";
import { indentLines } from "utilities/defold";
import { generateImageAssetsPath, generateSpritePath } from "utilities/path";

/**
 * Serializes atlas data.
 * @param atlasData - The atlas data to be serialized.
 * @returns The serialized atlas data.
 */
export async function serializeAtlasData(atlasData: AtlasData): Promise<SerializedAtlasData> {
  const { name, images } = atlasData;
  const atlas = serializeProperties(atlasData.atlas);
  const sprites = serializeAtlasImageData(images);
  const data = `${atlas}${sprites}`;
  const serializedData = {
    name,
    data,
    images,
  };
  return Promise.resolve(serializedData);
}

/**
 * Serializes sprite data.
 * @param images - The sprite data to be serialized.
 * @returns The serialized sprite data.
 */
function serializeAtlasImageData(images: SpriteData[]): string {
  return images.reduce(imageDataSerializer, "");
}

/**
 * Reducer function that serializes sprite data.
 * @param data - The cumulative serialized image data.
 * @param spriteData - The sprite data to be serialized.
 * @returns The updated serialized image data.
 */
function imageDataSerializer(data: string, { name, directory, sprite }: SpriteData) {
  const atlasImageAssetsPath = generateImageAssetsPath(directory);
  const imagePath = generateSpritePath(atlasImageAssetsPath, name);
  const image = serializeProperty("image", imagePath);
  const imageProperties = serializeProperties(sprite);
  return `${data}\nimages\n{\n${indentLines(`${image}\n${imageProperties}`)}\n}`;
}