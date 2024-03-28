import { getPluginData, setPluginData, removePluginData } from "utilities/figma";

export function updateSection(layer: SectionNode, data: PluginSectionData) {
  const pluginData = getPluginData(layer, "defoldSection");
  const guiNodeData = { defoldSection: { ...pluginData, ...data } };
  setPluginData(layer, guiNodeData); 
}

export function resetSection(layer: SceneNode) {
  removePluginData(layer, "defoldSection");
}

export function resetSections(layers: SceneNode[]) {
  layers.forEach((layer) => { resetSection(layer) });
}