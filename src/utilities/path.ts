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
 * Generates the script path within the specified script directory for the specified script name.
 * @param scriptPath - The path of the script directory.
 * @param scriptName - The name of the script.
 * @returns The script path.
 */
export function generateScriptPath(scriptPath: string, scriptName: string): string {
  const fileName = generateScriptFileName(scriptName);
  return `${scriptPath}/${fileName}`;
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


export function generateGameCollectionPath(name: string, filePath?: string): string {
  const fileName = generateGameCollectionFileName(name);
  if (filePath) {
    return `${filePath}/${fileName}`;
  }
  return fileName;
}

/**
 * Generates the .gui_script or .lua file name with the specified script name.
 * @param scriptName - The name of the script.
 * @param lua - Whether the script is just a Lua script.
 * @returns The script file name.
 */
export function generateScriptFileName(scriptName: string, lua = false): string {
  if (lua) {
    return `${scriptName}.lua`;
  }
  return `${scriptName}.gui_script`;
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
 * Generates a filename for the archive containing the exported GUI nodes.
 * @param gui - The serialized GUI data.
 * @returns The filename for the exported GUI nodes.
 */
export function generateGUINodesFileName(gui: SerializedGUIData[]) {
  const fileName = gui.length > 1 ? gui.length : gui[0].name;
  const suffix = gui.length > 1 ? "nodes" : "node";
  return `${fileName}.${suffix}.zip`;
}

export function generateGameCollectionFileName(gameObjectName: string): string {
  return `${gameObjectName}.collection`;
}

export function generateGameCollectionsFileName(gui: SerializedGameCollectionData[]) {
  const fileName = gui.length > 1 ? gui.length : gui[0].name;
  const suffix = gui.length > 1 ? "collections" : "collection";
  return `${fileName}.${suffix}.zip`;
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
 * Generates a filename for the exported atlases.
 * @param atlases - The atlases data.
 * @returns The filename for the exported atlases.
 */
export function generateAtlasesFileName(atlases: AtlasData[] | SerializedAtlasData[]) {
  const fileName = atlases.length > 1 ? atlases.length : atlases[0].name;
  const suffix = atlases.length > 1 ? "atlases" : "atlas";
  return `${fileName}.${suffix}.zip`;
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
 * Generates a filename for the exported sprites.
 * @param atlases - The atlases data.
 * @returns The filename for the exported sprites.
 */
export function generateSpritesFileName(atlases: SerializedAtlasData[]) {
  const fileName = atlases.length > 1 ? atlases.length : atlases[0].name;
  return `${fileName}.sprites.zip`;
}

/**
 * Generates the .font file name with the specified font name.
 * @param fontName - The name of the font.
 * @returns The font file name.
 */
export function generateFontFileName(fontName: string): string {
  return `${fontName}.font`;
}

/**
 * Sanitizes the GUI file name by removing naming conventions.
 * @param guiFileName - The GUI file name.
 * @returns The sanitized GUI file name.
 */
export function sanitizeFileName(guiNodeName: string): string {
  if (guiNodeName.startsWith(projectConfig.autoskip)) {
    return guiNodeName.replace(projectConfig.autoskip, "");
  }
  return guiNodeName;
}