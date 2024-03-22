export function isGUINode(layer: SceneNode) {
  return !!layer.getPluginData("defoldGUINode");
}

export function isAtlas(layer: SceneNode): layer is ComponentSetNode {
  return isFigmaComponentSet(layer) && !!layer.getPluginData("defoldAtlas");
}

export function isFigmaSceneNode(layer: BaseNode | null ): layer is SceneNode {
  return !!layer && (layer.type === "FRAME" || layer.type === "INSTANCE" || layer.type === "TEXT");
}

export function isFigmaComponent(layer: BaseNode): layer is ComponentNode {
  return layer.type === "COMPONENT";
}

export function isFigmaComponentSet(layer: BaseNode): layer is ComponentSetNode {
  return layer.type === "COMPONENT_SET";
}

export function isFigmaComponentInstance(layer: BaseNode): layer is InstanceNode {
  return layer.type === "INSTANCE";
}

export function isFigmaFrame(layer: BaseNode): layer is FrameNode {
  return layer.type === "FRAME";
}

export function isFigmaBox(layer: BaseNode): layer is (FrameNode | InstanceNode) {
  return isFigmaFrame(layer) || isFigmaComponentInstance(layer);
}

export function isFigmaText(layer: BaseNode): layer is TextNode {
  return layer.type === "TEXT";
}

export function hasChildren(layer: BoxLayer) {
  return !!layer.children?.length;
}

export function isGUINodeSelected(selection: SelectionUIData) {
  return selection?.gui?.length === 1;
}

export function areMultipleGUINodesSelected(selection: SelectionUIData) {
  return selection?.gui?.length > 1;
}

export function isAtlasSelected(selection: SelectionUIData) {
  return selection?.atlases?.length === 1;
}

export function areMultipleAtlasesSelected(selection: SelectionUIData) {
  return selection?.atlases?.length > 1;
}

export function isLayerSelected(selection: SelectionUIData) {
  return selection?.layers?.length === 1;
}

export function areMultipleLayersSelected(selection: SelectionUIData) {
  return selection?.layers?.length > 1;
}

export function hasSolidFills(fills: readonly Paint[] | typeof figma.mixed): fills is readonly SolidPaint[] {
  return Array.isArray(fills) && !!fills.length && fills.every(fill => fill.type === "SOLID");
}

export async function findMainComponent(layer: InstanceNode) {
  return await layer.getMainComponentAsync();
}

function pluginDataSetter(key: PluginDataKey, value: PluginData[PluginDataKey], layer: SceneNode) {
  if (value) {
    layer.setPluginData(key, JSON.stringify(value))
  }
}

export function setPluginData(layer: SceneNode, data: PluginData) {
  Object.entries(data).forEach(([key, value]) => { pluginDataSetter(key as PluginDataKey, value, layer); });
}

export function getPluginData<T extends PluginDataKey>(layer: SceneNode, key: T): PluginData[T] {
  const value = layer.getPluginData(key);
  if (value) {
    return JSON.parse(value);
  }
}

export function removePluginData(layer: SceneNode, keys: PluginDataKey[]) {
  keys.forEach(key => layer.setPluginData(key, ""));
}

function selectionReducer(selection: SelectionData, layer: SceneNode): SelectionData {
  if (layer.type !== "GROUP") {
    if (isAtlas(layer)) {
      selection.atlases.push(layer);
    } else if (isFigmaFrame(layer)) {
      selection.gui.push(layer);
    } else {
      selection.layers.push(layer);
    }
  }
  return selection;
}

export function reduceSelection(): SelectionData {
  const selection: SelectionData = { gui: [], atlases: [], layers: [] }; 
  return figma.currentPage.selection.reduce(selectionReducer, selection);
}

export function convertSelectionToSelectionUI(selection: SelectionData): SelectionUIData {
  return {
    gui: selection.gui.map(layer => getPluginData(layer, "defoldGUINode")),
    atlases: selection.atlases.map(layer => getPluginData(layer, "defoldAtlas")),
    layers: selection.layers,
  }
}