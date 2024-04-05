import { projectConfig } from "handoff/project";

export function generateImageAssetsPath(atlas: string): string {
  return `/${projectConfig.paths.assetsPath}/${projectConfig.paths.imageAssetsPath}/${atlas}`;
}

export function generateAtlasPath(atlas: string): string {
  const fileName = generateAtlasFileName(atlas);
  return `/${projectConfig.paths.assetsPath}/${projectConfig.paths.atlasAssetsPath}/${fileName}`;
}

export function generateFontPath(font: string): string {
  const fileName = generateFontFileName(font);
  return `/${projectConfig.paths.assetsPath}/${projectConfig.paths.fontAssetsPath}/${fileName}`;
}

export function generateSpritePath(atlasPath: string, spriteName: string): string {
  const fileName = generateSpriteFileName(spriteName);
  return `${atlasPath}/${fileName}`;
}

export function generateTemplatePath(templatePath: string, templateName: string): string {
  const fileName = generateGUIFileName(templateName);
  return `${templatePath}/${fileName}`;
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
