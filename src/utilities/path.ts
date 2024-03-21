import config from '../config/config.json';

export function generateAtlasPath(atlas: string): string {
  return `/${config.paths.assetsPath}/${config.paths.atlasAssetsPath}/${atlas}.atlas`;
}

export function generateFontPath(font: string): string {
  return `/${config.paths.assetsPath}/${config.paths.fontAssetsPath}/${font}.font`;
}

export function generateImageAssetsPath(atlas: string): string {
  return `${config.paths.assetsPath}/${config.paths.imageAssetsPath}/${atlas}`;
}

export function generateGUIFileName(guiNodeName: string): string {
  return `${guiNodeName}.gui`;
}

export function generateSpritePath(atlasPath: string, spriteName: string): string {
  return `${atlasPath}/${spriteName}.png`;
}
