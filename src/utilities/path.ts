/**
 * Utility module handling file paths based on project configuration.
 * @packageDocumentation
 */

import { projectConfig } from "handoff/project";

/**
 * Prepends the assets path to the specified resource path.
 * @param resourcePath - The resource path.
 * @returns The resource path with the assets path prepended.
 */
function prependAssetsPath(resourcePath: string): string {
  if (!projectConfig.paths.assetsPath) {
    return resourcePath;
  }
  return `/${projectConfig.paths.assetsPath}${resourcePath}`;
}

/**
 * Generates the image assets path for the specified atlas.
 * @param atlas - The name of the atlas.
 * @returns The image assets path.
 */
export function generateImageAssetsPath(atlas: string): string {
  const resourcePath = `/${projectConfig.paths.imageAssetsPath}/${atlas}`;
  return prependAssetsPath(resourcePath);
}

/**
 * Generates the atlas path for the specified atlas.
 * @param atlas - The name of the atlas.
 * @returns The atlas path.
 */
export function generateAtlasPath(atlas: string): string {
  const fileName = generateAtlasFileName(atlas);
  const resourcePath = `/${projectConfig.paths.atlasAssetsPath}/${fileName}`;
  return prependAssetsPath(resourcePath);
}

/**
 * Generates the font path for the specified font.
 * @param font - The name of the font.
 * @returns The font path.
 */
export function generateFontPath(font: FontData): string {
  const fileName = generateFontFileName(font.name);
  const resourcePath = `/${projectConfig.paths.fontAssetsPath}/${fileName}`;
  return prependAssetsPath(resourcePath);
}

/**
 * Generates the sprite path within the specified atlas path for the specified sprite name.
 * @param atlasPath - The path of the atlas.
 * @param spriteName - The name of the sprite.
 * @returns The sprite path.
 */
export function generateSpritePath(atlasPath: string, spriteName: string): string {
  const fileName = generateSpriteFileName(spriteName);
  return `${atlasPath}/${fileName}`;
}

/**
 * Generates the template path within the specified template directory for the specified template name.
 * @param templatePath - The path of the template directory.
 * @param templateName - The name of the template.
 * @returns The template path.
 */
export function generateTemplatePath(templatePath: string, templateName: string): string {
  const fileName = generateGUIFileName(templateName);
  return `${templatePath}/${fileName}`;
}

/**
 * Generates path to the GUI file with the specified GUI node name if a file path is provided.
 * @param name - The name of the GUI node.
 * @param filePath - The file path.
 * @returns The full path to the GUI file.
 */
export function generateGUIPath(name: string, filePath?: string): string {
  const fileName = generateGUIFileName(name);
  if (filePath) {
    return `${filePath}/${fileName}`;
  }
  return fileName;
}

/**
 * Generates the .gui file name with the specified GUI node name.
 * @param guiNodeName - The name of the GUI node.
 * @returns The GUI file name.
 */
export function generateGUIFileName(guiNodeName: string): string {
  return `${guiNodeName}.gui`;
}

/**
 * Generates the .atlas file name with the specified atlas name.
 * @param atlasName - The name of the atlas.
 * @returns The atlas file name.
 */
export function generateAtlasFileName(atlasName: string): string {
  return `${atlasName}.atlas`;
}

/**
 * Generates the sprite (.png) file name with the specified sprite name.
 * @param spriteName - The name of the sprite.
 * @returns The sprite file name.
 */
export function generateSpriteFileName(spriteName: string): string {
  return `${spriteName}.png`;
}


/**
 * Generates the .font file name with the specified font name.
 * @param fontName - The name of the font.
 * @returns The font file name.
 */
export function generateFontFileName(fontName: string): string {
  return `${fontName}.font`;
}
