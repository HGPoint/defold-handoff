type SpriteResourceData = string[];

type SpriteVariantPipelineData = {
  layer: SceneNode,
  skipVariants: boolean,
}

type TextureResourceData = Record<string, TextureAtlasData>;

type TextureAtlasData = TextureStaticAtlasData | TextureDynamicAtlasData;

type TextureStaticAtlasData = {
  id: string,
  path: string,
  ignore: boolean,
}

type TextureDynamicAtlasData = {
  sprites: TextureDynamicAtlasSpritesData,
  path: string,
}

type TextureDynamicAtlasSpritesData = {
  atlasName: string,
  ids: string[],
}

type TextureVariantPipelineData = {
  layer: SceneNode,
  skipVariants: boolean,
}

type FontData = Record<string, string>;

type FontVariantPipelineData = {
  layer: SceneNode,
  skipVariants: boolean,
}

type LayerData = string[];