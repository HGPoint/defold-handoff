type SelectionData = {
  gui: Exclude<ExportableLayer, SliceLayer>[],
  gameObjects: Exclude<ExportableLayer, SliceLayer>[],
  atlases: ComponentSetNode[],
  layers: SceneNode[],
  sections: SectionNode[],
}

type SelectionUIData = {
  gui: PluginGUINodeData[],
  gameObjects: PluginGameObjectData[],
  atlases: PluginAtlasData[],
  layers: SceneNode[],
  sections: PluginSectionData[],
  project: ProjectData,
  context?: WithNull<PluginContextData>,
  meta?: WithNull<SelectionUIMetaData>,
}

type SelectionUIMetaData = {
  canTryMatch?: boolean,
  originalValues?: WithNull<PluginGUINodeData>
}

type PluginSectionData = {
  id: string,
  bundled: boolean,
  jumbo: string,
  extension: string,
  ignore: boolean,
  layers: ProjectLayerData[],
  materials: ProjectMaterialData[],
  ignorePrefixes: boolean,
}

type PluginContextData = {
  layers: ProjectLayerData[],
  materials: ProjectMaterialData[],
  ignorePrefixes: boolean,
}

type PluginAtlasData = {
  id: string,
  extension: string,
  ignore: boolean,
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
  size_mode: SizeMode,
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
  replace_template: boolean,
  replace_template_name: string,
  replace_template_path: string,
  replace_spine: boolean,
  replace_spine_name: string,
  replace_spine_path: string,
}

type PluginGUINodesData = {
  exclude: WithNull<boolean>,
  screen: WithNull<boolean>,
  skip: WithNull<boolean>,
  fixed: WithNull<boolean>,
  cloneable: WithNull<boolean>,
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
  size_mode?: SizeMode,
  font?: string,

  exclude: boolean,
  skip: boolean,
  implied_game_object: boolean,
  arrange_depth: boolean,
  depth_axis: string,
  inferred: boolean,
  path: string,
  figma_node_type: NodeType,
}

type PluginSpineData = {
  id: string,
}

type PluginData = {
  defoldProject?: WithNull<ProjectData>,
  defoldSection?: WithNull<PluginSectionData>,
  defoldGUINode?: WithNull<PluginGUINodeData>,
  defoldGameObject?: WithNull<PluginGameObjectData>,
  defoldAtlas?: WithNull<PluginAtlasData>,
  defoldSlice9?: WithNull<boolean>,
} & {
  [key in PluginGUINodeDataOverrideKey]?: WithNull<PluginGUINodeData>
}

type PluginGUINodeDataOverrideKey = `defoldGUINodeOverride-${string}`

type PluginDataKey = keyof PluginData;

type UIMessage = {
  pluginMessage: PluginMessage,
}

type PluginMessage = {
  type: PluginMessageAction,
  data?: PluginMessagePayload,
}

type PluginMessagePayload = {
  mode?: UIMode,
  project?: Partial<ProjectData>,
  selection?: SelectionUIData,
  bundle?: BundleData,
  gui?: PluginGUINodeData[],
  guiNode?: PluginGUINodeData,
  gameObject?: PluginGameObjectData,
  atlas?: PluginAtlasData,
  section?: PluginSectionData,
  scheme?: string,
  image?: Uint8Array,
  option?: number | string | boolean,
}

type PluginMessageAction =
  PluginMessageStateAction |
  PluginMessageUIAction |
  PluginMessageProjectAction |
  PluginMessageBundleAction |
  PluginMessageSectionAction |
  PluginMessageGUIAction |
  PluginMessagesGameObjectAction |
  PluginMessagesAtlasAction |
  PluginMessageSpineAction |
  PluginMessagesLayerAction

type PluginMessageUIAction =
  "refreshPlugin" |
  "modeChanged" |
  "collapseUI" |
  "expandUI"

type PluginMessageStateAction =
  "selectionChanged"

type PluginMessageProjectAction =
  "updateProject" |
  "purgeUnusedData"

type PluginMessageGUIAction =
  "logGUI" |
  "exportGUI" |
  "guiExported" |
  "copyGUI" |
  "guiCopied" |
  "copyGUIScheme" |
  "guiSchemeCopied" |
  "updateGUI" |
  "updateGUINode" |
  "removeGUI" |
  "removeGUIOverrides" |
  "fixGUI" |
  "fixGUIText" |
  "matchGUINodeToGUIParent" |
  "matchGUINodeToGUIChild" |
  "resizeGUIToScreen" |
  "forceGUIChildrenOnScreen" |
  "validateGUI"

type PluginMessagesGameObjectAction =
  "exportGameCollections" |
  "gameCollectionsExported" |
  "copyGameCollection" |
  "gameCollectionCopied" |
  "updateGameObject" |
  "removeGameObjects" |
  "fixGameObjects" |
  "validateGameObjects"

type PluginMessagesAtlasAction =
  "exportAtlases" |
  "exportGUIAtlases" |
  "exportGameCollectionAtlases" |
  "atlasesExported" |
  "exportSprites" |
  "spritesExported" |
  "createAtlas" |
  "restoreAtlases" |
  "addSprites" |
  "updateAtlas" |
  "removeAtlases" |
  "fixAtlases" |
  "sortAtlases" |
  "fitAtlases" |
  "validateAtlases"

type PluginMessageSpineAction =
  "exportGUISpine" |
  "spinesExported"

type PluginMessageSectionAction =
  "updateSection" |
  "removeSections"

type PluginMessageBundleAction =
  "exportBundle" |
  "exportBareBundle" |
  "bundleExported"

type PluginMessagesLayerAction =
  "restoreSlice9" |
  "requestImage" |
  "imageExtracted"

