type AtlasExportPipelineData = {
  layer: AtlasLayer,
  parameters: AtlasExportParameters,
}

type AtlasData = {
  id: string,
  name: string,
  atlas: AtlasDefoldData,
  images: SpriteData[],
}

type AtlasExportParameters = {
  scale: number,
  usedSprites: string[],
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
  format: SpriteFormat,
  sprite: SpriteDefoldData,
  data: WithNull<Uint8Array>,
}

type SpriteFormat = "PNG" | "JPG" | "SVG";

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
  format: SpriteFormat,
  directory: string,
  data: WithNull<Uint8Array>,
}

type DynamicAtlas = {
  name: string,
  images: (SliceNode | TextNode)[]
}

type AtlasSpaceNode = {
  x: number;
  y: number;
  width: number;
  height: number;
  used?: boolean;
  right?: AtlasSpaceNode;
  down?: AtlasSpaceNode;
}