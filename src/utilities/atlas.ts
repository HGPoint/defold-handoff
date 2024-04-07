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

function sortSpritesByHeight(sprite1: SceneNode, sprite2: SceneNode) {
  return sprite2.height - sprite1.height;
}

export function packSprites(atlas: ComponentSetNode) {
  let maxHeight = 0;
  let maxWidth = 0;
  let currentRowHeight = 0;
  const sprites = [...atlas.children].sort(sortSpritesByHeight);
  sprites.forEach(sprite => {
    const { width, height } = sprite;
    if (height > currentRowHeight) {
      currentRowHeight = height;
    }
    if (maxWidth + width > atlas.width) {
      maxWidth = 0;
      maxHeight += currentRowHeight + 10; // Add gap
      currentRowHeight = height;
    }
    sprite.x = maxWidth;
    sprite.y = maxHeight;
    maxWidth += width + 10; // Add gap
  });
}