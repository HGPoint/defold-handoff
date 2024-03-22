type SelectionData = {
  gui: FrameNode[];
  atlases: ComponentSetNode[];
  layers: SceneNode[];
}

type PluginData = {
  defoldAtlas?: PluginAtlasData,
  defoldGUINode?: PluginGUINodeData,
}

type PluginAtlasData = {
  id: string,
}

type PluginGUINodeData = {
  id: string,
}

type PluginDataKey = keyof PluginData;

type PluginDataValue = PluginData[PluginDataKey];

type PluginMessageAction =
  "refreshPlugin" |
  "createGUINode" |
  "copyGUINodes" |
  "guiNodesCopied" |
  "exportGUINodes" |
  "guiNodesExported" |
  "exportBundle" |
  "bundleExported" |
  "destroyGUINodes" |
  "createAtlas" |
  "exportAtlases" |
  "atlasesExported" |
  "destroyAtlases" |
  "selectionChanged"

type PluginMessagePayload = {
  bundle?: BundleData,
  selection?: SelectionData
}

type PluginMessage = {
  type: PluginMessageAction,
  data?: PluginMessagePayload,
}

type PluginUIMessage = {
  pluginMessage: PluginMessage
}