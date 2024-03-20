type PluginUISection =
  "start" |
  "figmaLayer" |
  "figmaLayers" |
  "defoldComponent" |
  "defoldComponents" |
  "defoldAtlas" |
  "defoldAtlases"

type PluginUIAction =
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
  "destroyAtlases"

type PluginUIMessagePayloadData = {
  atlases?: AtlasData[],
  gui?: SerializedDefoldData[],
  bundle?: BundleData,
  paths?: ProjectPathData
  imageAssetsPath?: string,
}

type PluginUIMessagePayload = PluginUIMessagePayloadData | undefined

type PluginUIMessage = {
  type: PluginUIAction,
  data?: PluginUIMessagePayload
}