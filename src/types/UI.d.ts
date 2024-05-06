type UIMode = "developer" | "designer";

type UIData = {
  mode: UIMode,
  collapsed: boolean,
  guiNodePropertiesCollapsed?: boolean,
  guiNodeSpecialPropertiesCollapsed?: boolean,
  guiNodeToolsCollapsed?: boolean,
  guiNodeActionsCollapsed?: boolean,
  guiNodesToolsCollapsed?: boolean,
  guiNodesActionsCollapsed?: boolean,
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