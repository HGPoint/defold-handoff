import { generateImageAssetsPath, generateSpritePath } from "utilities/path";
import { propertySerializer } from "utilities/dataSerializers";

function imageDataSerializer(data: string, { name, directory, sprite }: SpriteData) {
  const atlasImageAssetsPath = generateImageAssetsPath(directory);
  const image = generateSpritePath(atlasImageAssetsPath, name);
  const imageProperties = Object.entries(sprite).reduce(propertySerializer, "");
  return `${data}\nimages\n{\nimage:"${image}"\n${imageProperties}}`;
}

function serializeAtlasImageData(images: SpriteData[]): string {
  return images.reduce(imageDataSerializer, "");
}

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

export function serializeAtlasDataSet(atlasDataSet: AtlasData[]): SerializedAtlasData[] {
  return atlasDataSet.map(serializeAtlasData);
}
