import config from '../config/config.json';

export function generateTexturePath(atlas: string): string {
  return `/${config.paths.assetsPath}/${config.paths.atlasAssetsPath}/${atlas}.atlas`;
}

export function generateFontPath(font: string): string {
  return `/${config.paths.assetsPath}/${config.paths.fontAssetsPath}/${font}.font`;
}