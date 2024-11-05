type AtlasExportPipelineData = {
  layer: AtlasLayer,
  parameters: AtlasExportParameters,
}

type AtlasData = {
  name: string,
  atlas: AtlasDefoldData,
  images: SpriteData[],
}

type AtlasExportParameters = {
  scale: number,
}

type AtlasDefoldData = {
  margin: number,
  extrude_borders: number,
  inner_padding: number,
  max_page_width: number,
  max_page_height: number,
}

type SpriteData = {
  name: string,
  directory: string,
  sprite: SpriteDefoldData,
  data: Uint8Array,
}

type SpriteDefoldData = {
  sprite_trim_mode: SpriteTrimMode,
}

type SerializedAtlasData = {
  name: string,
  data: string,
  images: SerializedSpriteData[],
}

type SerializedSpriteData = {
  name: string,
  directory: string,
  data: Uint8Array,
}

type DynamicAtlas = {
  name: string,
  images: SliceNode[]
}