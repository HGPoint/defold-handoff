import config from "config/config.json";
import { isFigmaSection, getPluginData, isFigmaPage } from "utilities/figma";

export function generateContextData(guiNode: ExportableLayer): PluginGUIContextData {
  let parent = guiNode.parent;
  while (parent && !isFigmaPage(parent) && (!isFigmaSection(parent) || !getPluginData(parent, "defoldSection"))) {
    parent = parent.parent;
  }
  if (parent && isFigmaSection(parent)) {
    const pluginData = getPluginData(parent, "defoldSection");
    return {
      layers: pluginData?.layers ? [...config.sectionDefaultValues.layers, ...pluginData.layers] : [...config.sectionDefaultValues.layers],
      materials: pluginData?.materials || [],
      ignorePrefixes: pluginData?.ignorePrefixes || config.sectionDefaultValues.ignorePrefixes
    }
  }
  return {
    layers: config.sectionDefaultValues.layers,
    materials: config.sectionDefaultValues.materials,
    ignorePrefixes: config.sectionDefaultValues.ignorePrefixes
  }
}