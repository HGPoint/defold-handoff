/**
 * Handles atlas data serialization.
 * @packageDocumentation
 */

import { PROJECT_CONFIG } from "handoff/project";
import { propertySerializer, serializeProperty } from "utilities/dataSerialization";
import { indentLines } from "utilities/defold";
import { generateImageAssetsPath, generateSpritePath } from "utilities/path";

/**
 * Serializes atlas data.
 * @param atlasData - The atlas data to be serialized.
 * @returns The serialized atlas data.
 */
export async function serializeAtlasData(atlasData: AtlasData): Promise<SerializedAtlasData> {
  const { name, images } = atlasData;
  const atlas = serializeAtlasDefoldData(atlasData.atlas);
  const sprites = serializeAtlasImageData(images);
  const data = `${sprites}${atlas}`.trim();
  const serializedData = {
    name,
    data,
    images,
  };
  return Promise.resolve(serializedData);
}

function serializeAtlasDefoldData(atlasData: AtlasDefoldData) {
  const properties = Object.entries(atlasData) as [keyof AtlasDefoldData, AtlasDefoldData[keyof AtlasDefoldData]][];
    const data = properties.reduce((serializedProperties: string, property) => {
      if (shouldExcludeAtlasProperty(property)) {
        return serializedProperties;
      }
      return propertySerializer(serializedProperties, property);
    }, "");
    return data;
}

function shouldExcludeAtlasProperty([property, value]: [keyof AtlasDefoldData, AtlasDefoldData[keyof AtlasDefoldData]]) {
if (PROJECT_CONFIG.omitDefaultValues) {
  return isAtlasPropertyDefaultValue(property, value);
  }
  return false;
}

function isAtlasPropertyDefaultValue(property: keyof AtlasDefoldData, value: AtlasDefoldData[keyof AtlasDefoldData]) {
  if (typeof value === "string") {
    return value === "";
  }
  if (typeof value === "number") {
    if (property === "extrude_borders" || property == "margin" || property == "inner_padding" || property == "max_page_width" || property == "max_page_height") {
      return value === 0;
    }
  }
  return false;
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
  const imageProperties = serializeAtlasSpriteProperties(sprite);
  return `${data}images {\n${indentLines(`${image}\n${imageProperties}`)}\n}\n`;
}

function serializeAtlasSpriteProperties(sprite: SpriteDefoldData) {
  const properties = Object.entries(sprite) as [keyof SpriteDefoldData, SpriteDefoldData[keyof SpriteDefoldData]][];
  return properties.reduce((serializedProperties: string, property) => {
    if (shouldExcludeAtlasSpriteProperty(property)) {
      return serializedProperties;
    }
    return propertySerializer(serializedProperties, property);
  }, "");
}

function shouldExcludeAtlasSpriteProperty([property, value]: [keyof SpriteDefoldData, SpriteDefoldData[keyof SpriteDefoldData]]) {
  if (PROJECT_CONFIG.omitDefaultValues) {
    return isAtlasSpritePropertyDefaultValue(property, value);
  }
  return false;
}

function isAtlasSpritePropertyDefaultValue(property: keyof SpriteDefoldData, value: SpriteDefoldData[keyof SpriteDefoldData]) {
  if (property === "sprite_trim_mode") {
    return value === "SPRITE_TRIM_MODE_OFF";
  }
  return false;
}
