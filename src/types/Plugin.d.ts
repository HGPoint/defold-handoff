type SelectionUIData = {
  gui: PluginGUINodeData[],
  atlases: PluginAtlasData[],
  layers: SceneNode[],
  sections: PluginSectionData[],
  project: ProjectData,
  context?: PluginGUIContextData,
  canTryMatch: boolean,
}

type SelectionData = {
  gui: ExportableLayer[],
  atlases: ComponentSetNode[],
  layers: SceneNode[],
  sections: SectionNode[],
}

type PluginSectionData = {
  id: string,
  bundled: boolean,
  jumbo: string,
  layers: ProjectLayerData[],
  materials: ProjectMaterialData[],
  ignorePrefixes: boolean,
}

type PluginAtlasData = {
  id: string,
}

type PluginGUIContextData = {
  layers: ProjectLayerData[],
  materials: ProjectMaterialData[],
  ignorePrefixes: boolean,
}

type PluginGUINodeData = {
  id: string,
  type: GUINodeType,
  enabled: boolean,
  visible: boolean,
  inherit_alpha: boolean,
  blend_mode: GUINodeBlendMode,
  scale: Vector4,
  material: string,
  slice9: Vector4,
  layer: string,
  pivot: Pivot,
  size_mode: SizeMode | "PARSED",
  xanchor: XAnchor,
  yanchor: YAnchor,
  adjust_mode: AdjustMode,
  clipping_mode: ClippingMode,
  clipping_inverted: boolean,
  font?: string,

  exclude: boolean,
  screen: boolean,
  skip: boolean,
  fixed: boolean,
  cloneable: boolean,
  export_variants: string,
  path: string,
  template: boolean,
  template_path: string,
  template_name: string,
  script: boolean,
  script_path: string,
  script_name: string,
  wrapper: boolean,
  wrapper_padding: Vector4,
}

type PluginData = {
  defoldGUINode?: PluginGUINodeData | null,
  defoldAtlas?: PluginAtlasData | null,
  defoldSlice9?: boolean | null,
  defoldScale?: boolean | null,
  defoldSection?: PluginSectionData | null,
  defoldProject?: ProjectData | null,
}

type PluginDataKey = keyof PluginData;

type PluginMessageAction =
  "refreshPlugin" |
  "copyGUINodes" |
  "guiNodesCopied" |
  "exportGUINodes" |
  "guiNodesExported" |
  "copyGUINodeScheme" |
  "guiNodeSchemeCopied" |
  "fixGUINodes" |
  "resizeScreenNodes" |
  "matchGUINodes" |
  "validateGUINodes" |
  "resetGUINodes" |
  "updateGUINode" |
  "showGUINodeData" |
  "createAtlas" |
  "restoreAtlases" |
  "addSprites" |
  "exportAtlases" |
  "atlasesExported" |
  "fixAtlases" |
  "sortAtlases" |
  "fitAtlases" |
  "validateAtlases" |
  "destroyAtlases" |
  "exportBundle" |
  "bundleExported" |
  "selectionChanged" |
  "modeChanged" |
  "fixTextNode" |
  "restoreSlice9Node" |
  "updateSection" |
  "resetSections" |
  "updateProject" | 
  "collapseUI" |
  "expandUI" |
  "requestImage" |
  "requestedImage"

type PluginMessagePayload = {
  bundle?: BundleData,
  selection?: SelectionUIData,
  mode?: UIMode,
  image?: Uint8Array,
  guiNode?: PluginGUINodeData,
  section?: PluginSectionData,
  scheme?: string,
  project?: Partial<ProjectData>,
}

type PluginMessage = {
  type: PluginMessageAction,
  data?: PluginMessagePayload,
}

type PluginUIMessage = {
  pluginMessage: PluginMessage,
}
