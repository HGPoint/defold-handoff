type TextureData = Record<string, TextureAtlasData>;

type TextureVariantPipelineData = {
  layer: SceneNode,
  skipVariants: boolean,
}

type TextureAtlasData = TextureStaticAtlasData | TextureDynamicAtlasData;

type TextureStaticAtlasData = {
  id: string,
  path: string,
}

type TextureDynamicAtlasData = {
  sprites: TextureDynamicAtlasSpritesData,
  path: string,
}

type TextureDynamicAtlasSpritesData = {
  atlasName: string,
  ids: string[],
}

type FontData = Record<string, string>;

type FontVariantPipelineData = {
  layer: SceneNode,
  skipVariants: boolean,
}

type LayerData = string[];