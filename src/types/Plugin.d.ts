type SelectionData = {
  guiNodes: FrameNode[];
  atlases: ComponentSetNode[];
  layers: SceneNode[];
}

type PluginData = {
  defoldAtlas?: PluginAtlasData;
  defoldGUINode?: PluginGUINodeData;
}

type PluginAtlasData = {
  id: string;
}

type PluginGUINodeData = {
  id: string;
}

type PluginDataKey = keyof PluginData;

type PluginDataValue = PluginData[PluginDataKey];
