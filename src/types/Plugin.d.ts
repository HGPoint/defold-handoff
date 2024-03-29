type SelectionUIData = {
  gui: PluginGUINodeData[],
  atlases: PluginAtlasData[],
  layers: SceneNode[],
  sections: PluginSectionData[],
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
}

type PluginAtlasData = {
  id: string,
}

type PluginGUINodeData = {
  type?: "box" | "text",
  id?: string,
  skip?: boolean,
  enabled?: boolean,
  visible?: boolean,
  inherit_alpha?: boolean,
  blend_mode?: GUINodeBlendMode,
  scale?: Vector4,
  material?: string,
  slice9?: Vector4,
  layer?: string,
  pivot?: Pivot,
  size_mode?: SizeMode,
  xanchor?: XAnchor,
  yanchor?: YAnchor,
  adjust_mode?: AdjustMode,
  clipping_mode?: ClippingMode,
  clipping_inverted?: boolean,
}

type PluginData = {
  defoldGUINode?: PluginGUINodeData | null,
  defoldAtlas?: PluginAtlasData | null,
  defoldSlice9?: boolean | null,
  defoldSection?: PluginSectionData | null,
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
  "validateGUINodes" |
  "resetGUINodes" |
  "updateGUINode" |
  "showGUINodeData" |
  "createAtlas" |
  "exportAtlases" |
  "atlasesExported" |
  "fixAtlases" |
  "validateAtlases" |
  "destroyAtlases" |
  "exportBundle" |
  "bundleExported" |
  "selectionChanged" |
  "fixTextNode" |
  "restoreSlice9Node" |
  "updateSection" |
  "resetSections"

type PluginMessagePayload = {
  bundle?: BundleData,
  selection?: SelectionUIData,
  guiNode?: PluginGUINodeData,
  section?: PluginSectionData,
  scheme?: string,
}

type PluginMessage = {
  type: PluginMessageAction,
  data?: PluginMessagePayload,
}

type PluginUIMessage = {
  pluginMessage: PluginMessage,
}
