type UIMode = "developer" | "designer" | "game-designer";

type UIData = {
  mode: UIMode,
  collapsed: boolean,

  guiNodePropertiesCollapsed?: boolean,
  guiNodeSpecialPropertiesCollapsed?: boolean,
  guiNodeToolsCollapsed?: boolean,
  guiNodeActionsCollapsed?: boolean,

  gameObjectPropertiesCollapsed?: boolean,
  gameObjectSpecialPropertiesCollapsed?: boolean,
  gameObjectToolsCollapsed?: boolean,
  gameObjectActionsCollapsed?: boolean,

  gameObjectsToolsCollapsed?: boolean,
  gameObjectsActionsCollapsed?: boolean,

  guiNodesToolsCollapsed?: boolean,
  guiNodesActionsCollapsed?: boolean,

  atlasPropertiesCollapsed?: boolean,
  atlasToolsCollapsed?: boolean,
  atlasActionsCollapsed?: boolean,

  atlasesToolsCollapsed?: boolean,
  atlasesActionsCollapsed?: boolean,

  sectionGUIPropertiesCollapsed?: boolean,
  sectionAtlasPropertiesCollapsed?: boolean,
  sectionToolsCollapsed?: boolean,
  sectionActionsCollapsed?: boolean,

  sectionsToolsCollapsed?: boolean,
  sectionsActionsCollapsed?: boolean,

  layerActionsCollapsed?: boolean,
  layersActionsCollapsed?: boolean,
};