 type SelectionUIData = {
  gui: (PluginGUINodeData | undefined)[];
  atlases: (PluginAtlasData | undefined)[];
  layers: SceneNode[];
}

type SelectionData = {
  gui: FrameNode[];
  atlases: ComponentSetNode[];
  layers: SceneNode[];
}

type PluginAtlasData = {
  id: string,
}

type PluginGUINodeData = {
  id?: string,
  enabled?: boolean,
  visible?: boolean,
  inherit_alpha?: boolean,
  blend_mode?: GUINodeBlendMode,
}

type PluginData = {
  defoldAtlas?: PluginAtlasData,
  defoldGUINode?: PluginGUINodeData,
}

type PluginDataKey = keyof PluginData;

type PluginMessageAction =
  "refreshPlugin" |
  "copyGUINodes" |
  "guiNodesCopied" |
  "exportGUINodes" |
  "guiNodesExported" |
  "resetGUINodes" |
  "updateGUINode" |
  "createAtlas" |
  "exportAtlases" |
  "atlasesExported" |
  "destroyAtlases" |
  "exportBundle" |
  "bundleExported" |
  "selectionChanged"

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