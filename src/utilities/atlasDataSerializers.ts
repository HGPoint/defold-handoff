import { generateImageAssetsPath, generateSpritePath } from "utilities/path";
import { propertySerializer } from "utilities/dataSerializers";

function imageDataSerializer(data: string, { name, sprite }: SpriteData, atlasImageAssetsPath: string) {
  const image = generateSpritePath(atlasImageAssetsPath, name);
  const imageProperties = Object.entries(sprite).reduce(propertySerializer, "");
  return `${data}\nimages\n{\nimage:"${image}"\n${imageProperties}}`;
}

function serializeAtlasImageData(images: SpriteData[], atlasImageAssetsPath: string): string {
  return images.reduce((data, image) => imageDataSerializer(data, image, atlasImageAssetsPath), "");
}

export function serializeAtlasData(atlasData: AtlasData): SerializedAtlasData {
  const { name, images } = atlasData;
  const atlas = Object.entries(atlasData.atlas).reduce(propertySerializer, "")
  const atlasImageAssetsPath = generateImageAssetsPath(name);
  const sprites = serializeAtlasImageData(images, atlasImageAssetsPath);
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
