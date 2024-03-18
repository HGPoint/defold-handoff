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
  "createAdvancedDefoldComponent" |
  "copyComponentsToDefold" |
  "componentsCopiedToDefold" |
  "exportComponentsToDefold" |
  "componentsExportedToDefold" |
  "destroyAdvancedDefoldComponents" |
  "createDefoldAtlas" |
  "updateDefoldAtlas" |
  "exportDefoldAtlases" |
  "defoldAtlasesExported" |
  "destroyDefoldAtlases" |
  "figmaSelectionUpdated"

type PluginUIMessage = {
  type: PluginUIAction,
  data?: PluginUIMessagePayload
}

type PluginUIMessagePayload = {
  atlases?: AtlasData[],
  components?: string[],
  selection?: PluginUISelectionData,
  paths?: DefoldPathsData
  imageAssetsPath?: string,
} | undefined

type PluginUISelectionData = {
  defoldComponents: DefoldComponentData[];
  defoldAtlases: DefoldAtlasData[];
}