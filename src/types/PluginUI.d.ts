type PluginUISection =
  "start" |
  "figmaLayer" |
  "figmaLayers" |
  "defoldComponent" |
  "defoldComponents" |
  "defoldAtlas" |
  "defoldAtlases"

type PluginUIAction =
  "refresh" |
  "createDefoldComponents" |
  "exportDefoldComponents" |
  "removeDefoldComponents" |
  "createDefoldAtlas" |
  "exportDefoldAtlases" |
  "defoldAtlasesExported" |
  "removeDefoldAtlases"

type PluginUIMessage = {
  type: PluginUIAction,
  atlases?: Uint8Array[][]
}