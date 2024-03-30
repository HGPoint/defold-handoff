import { isFigmaSceneNode, isFigmaSection, getPluginData } from "utilities/figma";

export function calculateAtlasName(atlas: ComponentSetNode) {
  const section = atlas.parent;
  if (isFigmaSceneNode(section) && isFigmaSection(section)) {
    const combineAs = getPluginData(section, "defoldSection")?.jumbo
    if (combineAs) {
      return combineAs;
    }
  }
  return atlas.name;
}
