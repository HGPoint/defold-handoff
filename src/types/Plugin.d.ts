type SelectionUIData = {
  gui: PluginGUINodeData[],
  atlases: PluginAtlasData[],
  layers: SceneNode[],
  sections: PluginSectionData[],
  gameObjects: PluginGameObjectData[],
  project: ProjectData,
  context?: PluginGUIContextData,
  canTryMatch: boolean,
  originalValues: PluginGUINodeData | null,
}

type SelectionData = {
  gui: ExportableLayer[],
  atlases: ComponentSetNode[],
  layers: SceneNode[],
  sections: SectionNode[],
  gameObjects: ExportableLayer[],
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
  blend_mode: BlendingMode,
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
  inferred: boolean,
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
  figma_node_type: NodeType,
}

type PluginGameObjectData = {
  id: string,
  type: GameObjectType,
  blend_mode?: BlendingMode,
  position: Vector4,
  scale: Vector4,
  material?: string,
  slice9?: Vector4,
  pivot?: Pivot,
  size_mode?: SizeMode | "PARSED",
  font?: string,

  exclude: boolean,
  skip: boolean,
  implied_game_object: boolean,
  arrange_depth: boolean,
  depth_axis: string,
  inferred: boolean,
  path: string,
  figma_node_type: NodeType
}

type PluginGUIMassNodeData = {
  exclude: boolean | null
  screen: boolean | null
  skip: boolean | null
  fixed: boolean | null
  cloneable: boolean | null
}

type PluginDataOverrideKey = `defoldGUINodeOverride-${string}`

type PluginData = {
  defoldGUINode?: PluginGUINodeData | null,
  defoldAtlas?: PluginAtlasData | null,
  defoldGameObject?: PluginGameObjectData | null,
  defoldSection?: PluginSectionData | null,
  defoldProject?: ProjectData | null,
  defoldSlice9?: boolean | null,
  defoldScale?: boolean | null,
} & {
  [key in PluginDataOverrideKey]?: PluginGUINodeData | null
}

type PluginDataKey = keyof PluginData;

type PluginMessageAction =
  "refreshPlugin" |
  "copyGUINodes" |
  "guiNodesCopied" |
  "exportGUINodes" |
  "guiNodesExported" |
  "exportGUINodeAtlases" |
  "guiNodeAtlasesExported" |
  "copyGUINodeScheme" |
  "guiNodeSchemeCopied" |
  "fixGUINodes" |
  "resizeScreenGUINodes" |
  "matchGUINodes" |
  "matchParentToGUINode" |
  "matchGUINodeToParent" |
  "forceChildrenOnScreen" |
  "validateGUINodes" |
  "resetGUINodes" |
  "updateGUINode" |
  "updateGUINodes" |
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
  "exportSprites" |
  "spritesExported" |
  "exportBundle" |
  "bundleExported" |
  "pullFromMainComponent" |
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
  "requestedImage" |
  "exportGameObjects" |
  "gameObjectsExported" |
  "fixGameObjects" |
  "resetGameObjects" |
  "updateGameObject" |
  "copyGameObjects" |
  "gameObjectsCopied" |
  "exportGameObjectAtlases" |
  "gameObjectAtlasesExported"

type PluginMessagePayload = {
  bundle?: BundleData,
  selection?: SelectionUIData,
  mode?: UIMode,
  image?: Uint8Array,
  gui?: PluginGUINodeData[],
  guiNode?: PluginGUINodeData,
  gameObject?: PluginGameObjectData,
  section?: PluginSectionData,
  scheme?: string,
  project?: Partial<ProjectData>,
  option?: number | string | boolean,
}

type PluginMessage = {
  type: PluginMessageAction,
  data?: PluginMessagePayload,
}

type PluginUIMessage = {
  pluginMessage: PluginMessage,
}

type VariantExtractor = (layer: BoxLayer, texturesData: TextureData, skipVariants?: boolean) => Promise<void>;