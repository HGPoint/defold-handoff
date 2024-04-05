type ProjectPathData = {
  assetsPath: string,
  atlasAssetsPath: string,
  imageAssetsPath: string,
  fontAssetsPath: string,
  spineAssetsPath: string,
}

type ProjectData = {
  paths: ProjectPathData,
  fontFamilies: string[],
}

type SpriteComponentData = {
  sprite_trim_mode: SpriteTrimMode,
}

type SpriteData = {
  name: string,
  directory: string,
  sprite: SpriteComponentData,
  data: Uint8Array,
}

type SerializedSpriteData = {
  name: string,
  directory: string,
  data: Uint8Array,
}

type AtlasComponentData = {
  margin: number,
  extrude_borders: number,
  inner_padding: number,
  max_page_width: number,
  max_page_height: number,
}

type AtlasData = {
  name: string,
  atlas: AtlasComponentData,
  images: SpriteData[],
}

type SerializedAtlasData = {
  name: string,
  data: string,
  images: SerializedSpriteData[],
}

type GUIComponentData = {
  script: string,
  background_color: Vector4,
  material: string,
  adjust_reference: string,
  max_nodes: number
}

type GUIComponentDataKey = keyof GUIComponentData;

type GUIComponentDataValue = GUIComponentData[GUIComponentDataKey];

type GUINodeData = {
  type: GUINodeType,
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
  size_mode: SizeMode,
  slice9: Vector4,
  layer?: string,
  material?: string,
  xanchor: XAnchor,
  yanchor: YAnchor,
  pivot: Pivot,
  adjust_mode: AdjustMode,
  clipping_mode: ClippingMode,
  clipping_visible: boolean,
  clipping_inverted: boolean,
  blend_mode: GUINodeBlendMode,
  custom_type: number,
  template_node_child: boolean,

  skip: boolean,
  cloneable: boolean,
  template: boolean,
  template_path: string,
  template_name: string,
  wrapper: boolean,
  wrapper_padding: Vector4,
  exportable_layer: ExportableLayer,
  children?: GUINodeData[],
}

type GUINodeNonDefoldProperties = "skip" | "cloneable" | "template" | "template_path" | "template_name" | "wrapper" | "wrapper_padding" | "exportable_layer" | "children";

type GUINodeDataKey = keyof GUINodeData;

type GUINodeDataValue = GUINodeData[GUINodeDataKey];

type SerializableGUINodeDataKey = keyof Omit<GUINodeData, GUINodeNonDefoldProperties>;

type SerializableGUINodeDataValue = GUINodeData[SerializableGUINodeDataKey];

type GUINodeDataExportOptions = {
  layer: ExportableLayer,
  atRoot: boolean,
  namePrefix: string,
  parentId: string,
  parentPivot: Pivot,
  parentSize: Vector4,
  parentShift: Vector4,
  parentChildren: GUINodeData[],
}

type GUINodeCloneData = {
  cloneOf: ComponentNode,
  cloneInstance: InstanceNode,
}

type TextureAtlasData = {
  id: string,
  path: string,
}

type TextureData = Record<string, TextureAtlasData>;

type FontData = Record<string, string>;

type GUIData = {
  name: string,
  gui: GUIComponentData,
  nodes: GUINodeData[],
  textures: TextureData,
  fonts: FontData
}

type SerializedGUIData = {
  name: string,
  data: string,
}

type BundleData = {
  gui?: SerializedGUIData[],
  atlases?: SerializedAtlasData[],
}
