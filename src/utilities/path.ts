import config from "config/config.json";

export function generateImageAssetsPath(atlas: string): string {
  return `/${config.paths.assetsPath}/${config.paths.imageAssetsPath}/${atlas}`;
}

export function generateAtlasPath(atlas: string): string {
  const fileName = generateAtlasFileName(atlas);
  return `/${config.paths.assetsPath}/${config.paths.atlasAssetsPath}/${fileName}`;
}

export function generateFontPath(font: string): string {
  const fileName = generateFontFileName(font);
  return `/${config.paths.assetsPath}/${config.paths.fontAssetsPath}/${fileName}`;
}

export function generateSpritePath(atlasPath: string, spriteName: string): string {
  const fileName = generateSpriteFileName(spriteName);
  return `${atlasPath}/${fileName}`;
}

export function generateGUIFileName(guiNodeName: string): string {
  return `${guiNodeName}.gui`;
}

export function generateAtlasFileName(atlasName: string): string {
  return `${atlasName}.atlas`;
}

export function generateSpriteFileName(spriteName: string): string {
  return `${spriteName}.png`;
}

export function generateFontFileName(fontName: string): string {
  return `${fontName}.font`;
}