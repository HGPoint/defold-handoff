type ProjectPathData = {
  assetsPath: string;
  atlasAssetsPath: string;
  imageAssetsPath: string;
  fontAssetsPath: string;
  spineAssetsPath: string;
}

type AtlasData = {
  name: string;
  sprites: SpriteData[];
}

type SpriteData = {
  name: string;
  data: Uint8Array;
}

type GUIData = {
  script: string,
  background_color: Vector4,
  material: string,
  adjust_reference: string,
  max_nodes: number
}

type GUIDataKey = keyof GUIData;

type GUIDataValue = GUIData[GUIDataKey];

type GUINodeData = {
  type: string,
  id: string,
  parent?: string,
  enabled: boolean,
  visible: boolean,
  position: Vector4,
  rotation: Vector4,
  scale: Vector4,
  size: Vector4,
  inherit_alpha: boolean,
  color: Vector4,
  text?: string,
  font?: string,
  outline?: Vector4,
  shadow?: Vector4,
  texture?: string,
  size_mode: string,
  slice9: Vector4,
  layer?: string,
  material?: string,
  xanchor: string,
  yanchor: string,
  pivot: string,
  adjust_mode: string,
  clipping_mode: string,
  clipping_visible: boolean,
  clipping_inverted: boolean,
  blend_mode: string,
  custom_type: number,
  template_node_child: boolean,
}

type GUINodeDataKey = keyof GUINodeData;

type GUINodeDataValue = GUINodeData[GUINodeDataKey];

type TextureAtlasData = {
  path: string;
  id: string;
}

type TextureData = Record<string, TextureAtlasData>;

type FontData = Record<string, string>;

type DefoldData = {
  name: string;
  gui: GUIData;
  nodes: GUINodeData[];
  textures: TextureData;
  fonts: FontData
}

type SerializedDefoldData = {
  name: string;
  data: string;
}

type BundleData = {
  gui: SerializedDefoldData[];
  atlases: AtlasData[];
  paths?: ProjectPathData;
}
