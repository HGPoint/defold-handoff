type PluginUISection = 'start' | 'figmaLayer' | 'multipleFigmaLayers' | 'defoldComponent' | 'multipleDefoldComponents'

type PluginUIAction = 'createDefoldComponent' | 'removeDefoldComponent' | 'refresh'

type PluginUIMessage = { action: PluginUIAction }