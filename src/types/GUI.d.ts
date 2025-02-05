type GUIExportPipelineData = {
  layer: ExportableLayer,
  parameters: GUINodeExportParameters,
}

type GUIVariantPipelineData = {
  layer: BoxLayer,
  options: GUINodeDataExportOptions,
}

type GUIData = {
  name: string,
  gui: GUIDefoldData,
  nodes: GUINodeData[],
  textures?: TextureResourceData,
  fonts?: FontData,
  layers?: LayerData,
  filePath: string,
  asTemplate: boolean,
}

type GUIDefoldData = {
  script: string,
  background_color: Vector4,
  material: string,
  adjust_reference: string,
  max_nodes: number
}

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
  alpha: number,
  text?: string,
  font?: string,
  outline?: Vector4,
  outline_alpha?: number,
  line_break?: boolean,
  text_leading?: number,
  text_tracking?: number,
  shadow?: Vector4,
  shadow_alpha?: number,
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
  blend_mode: BlendingMode,
  custom_type: number,
  template_node_child: boolean,

  skip: boolean,
  cloneable: boolean,
  screen: boolean,
  fixed: boolean,
  path: string,
  template: boolean,
  template_path: string,
  template_name: string,
  wrapper: boolean,
  wrapper_padding: Vector4,
  export_variants: string,
  exclude: boolean,
  inferred: boolean,
  texture_size?: Vector4,
  exportable_layer: ExportableLayer,
  exportable_layer_name: string,
  exportable_layer_id: string,
  figma_position: Vector4,
  figma_node_type: string,
  children?: GUINodeData[],
  script: boolean,
  script_path: string,
  script_name: string,
}

type GUINodeExportParameters = {
  asTemplate?: boolean,
  textAsSprites?: boolean,
  collapseEmpty?: boolean,
  collapseTemplates?: boolean
}

type GUINodeDataExportOptions = {
  layer: ExportableLayer,
  asTemplate: boolean,
  textAsSprites: boolean,
  collapseEmpty: boolean,
  collapseTemplates: boolean
  atRoot: boolean,
  namePrefix: string,
  variantPrefix?: string,
  forcedName?: string,
  clones: GUINodeExportCloneData[],
  parentId: string,
  parentPivot: Pivot,
  parentSize: Vector4,
  parentShift: Vector4,
}

type GUINodeExportCloneData = {
  cloneOf: ComponentNode,
  cloneInstance: InstanceNode,
}

type SerializedGUIData = {
  name: string,
  data: string,
  filePath?: string,
  template?: boolean,
  templateName?: string,
  templatePath?: string,
}

type SerializedGUISchemeData = {
  name: string,
  data: string,
}
