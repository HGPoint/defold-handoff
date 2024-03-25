 type SelectionUIData = {
  gui: PluginGUINodeData[];
  atlases: PluginAtlasData[];
  layers: SceneNode[];
}

type SelectionData = {
  gui: ExportableLayer[];
  atlases: ComponentSetNode[];
  layers: SceneNode[];
}

type PluginAtlasData = {
  id: string,
}

type PluginGUINodeData = {
  type?: "box" | "text",
  id?: string,
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
}

type PluginDataKey = keyof PluginData;

type PluginMessageAction =
  "refreshPlugin" |
  "copyGUINodes" |
  "guiNodesCopied" |
  "exportGUINodes" |
  "guiNodesExported" |
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
  "fixTextNode"

type PluginMessagePayload = {
  bundle?: BundleData,
  selection?: SelectionUIData,
  guiNode?: PluginGUINodeData,

}

type PluginMessage = {
  type: PluginMessageAction,
  data?: PluginMessagePayload,
}

type PluginUIMessage = {
  pluginMessage: PluginMessage
}