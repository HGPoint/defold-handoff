/**
 * Handles operations with paths based on the project configuration.
 * @packageDocumentation
 */

import { PROJECT_CONFIG } from "handoff/project";

/**
 * Generates the path to the image assets for the atlas.
 * @param atlas - The name of the atlas.
 * @returns The path to the image assets.
 */
export function generateImageAssetsPath(atlas: string): string {
  const { assetsPath, imageAssetsPath } = PROJECT_CONFIG.paths;
  const path = resolveFilePathFromSegments(assetsPath, imageAssetsPath, atlas);
  return path;
}

/**
 * Generates the path to the atlas.
 * @param atlas - The name of the atlas.
 * @returns The path to the atlas.
 */
export function generateAtlasPath(atlas: string, extension: string = "atlas"): string {
  const { assetsPath, atlasAssetsPath } = PROJECT_CONFIG.paths;
  const fileName = generateAtlasFileName(atlas, extension);
  const path = resolveFilePathFromSegments(assetsPath, atlasAssetsPath, fileName);
  return path;
}

/**
 * Generates the path to the font.
 * @param font - The name of the font.
 * @returns The path to the font.
 */
export function generateFontPath(font: FontData): string {
  const { assetsPath, fontAssetsPath } = PROJECT_CONFIG.paths;
  const fileName = generateFontFileName(font.name);
  const path = resolveFilePathFromSegments(assetsPath, fontAssetsPath, fileName);
  return path;
}

/**
 * Generates the path to the sprite.
 * @param atlasPath - The path to the atlas.
 * @param spriteName - The name of the sprite.
 * @returns The path to the sprite.
 */
export function generateSpritePath(atlasPath: string, spriteName: string): string {
  const fileName = generateSpriteFileName(spriteName);
  const path = resolveFilePathFromPathName(atlasPath, fileName);
  return path;
}

/**
 * Generates the path to the template.
 * @param templatePath - The path of the template directory.
 * @param templateName - The name of the template.
 * @returns The template path.
 */
export function generateTemplatePath(templatePath: string, templateName: string): string {
  const fileName = generateGUIFileName(templateName);
  const path = resolveFilePathFromPathName(templatePath, fileName);
  return path;
}

/**
 * Generates the path to the script.
 * @param scriptPath - The path of the script directory.
 * @param scriptName - The name of the script.
 * @returns The script path.
 */
export function generateScriptPath(scriptPath: string, scriptName: string): string {
  const fileName = generateScriptFileName(scriptName);
  const path = resolveFilePathFromPathName(scriptPath, fileName);
  return path;
}

/**
 * Generates the path to the GUI file.
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
 * Generates the path to the collection file.
 * @param name - The name of the collection.
 * @param filePath - The file path.
 * @returns The full path to the collection file.
 */
export function generateGameCollectionPath(name: string, filePath?: string): string {
  const fileName = generateGameCollectionFileName(name);
  if (filePath) {
    return `${filePath}/${fileName}`;
  }
  return fileName;
}

/**
 * Generates the path to the bundle file.
 * @param bundle - The bundle data to generate the path from.
 * @returns The full path to the bundle file.
 */
export function generateBundleFileName(bundle: BundleData): string {
  const fileNamePrefix = resolveBundleFileNamePrefix(bundle);
  const fileName = resolveArchiveFileName(fileNamePrefix, "resources");
  return fileName;
}

/**
 * Generates the file name for the .gui_script or the .lua script file.
 * @param scriptName - The name of the script.
 * @param lua - Whether the script is a Lua script.
 * @returns The script file name.
 */
export function generateScriptFileName(scriptName: string, lua = false): string {
  const extension = lua ? "lua" : "gui_script";
  const fileName = resolveFileName(scriptName, extension);
  return fileName;
}

/**
 * Generates the file name for the GUI.
 * @param guiName - The name of the GUI.
 * @returns The GUI file name.
 */
export function generateGUIFileName(guiName: string): string {
  const fileName = resolveFileName(guiName, "gui");
  return fileName;
}

/**
 * Generates the file name for the archive with GUI components.
 * @param gui - The serialized GUI data to generate the file name from.
 * @returns The archive file name.
 */
export function generateGUINodesFileName(gui: SerializedGUIData[]) {
  const fileNamePrefix = resolveFileNamePrefix(gui);
  const fileNameSuffix = resolveFileNameSuffix(gui, "node");
  const fileName = resolveArchiveFileName(fileNamePrefix, fileNameSuffix);
  return fileName;
}

/**
 * Generates the file name for the game collection.
 * @param gameCollectionName - The name of the game collection.
 * @returns The game collection file name.
 */
export function generateGameCollectionFileName(gameCollectionName: string): string {
  const fileName = resolveFileName(gameCollectionName, "collection");
  return fileName;
}

/**
 * Generates the file name for the archive with game collections.
 * @param gameCollections - The serialized game collections data to generate the file name from.
 * @returns The archive file name.
 */
export function generateGameCollectionsFileName(gameCollections: SerializedGameCollectionData[]) {
  const fileNamePrefix = resolveFileNamePrefix(gameCollections);
  const fileNameSuffix = resolveFileNameSuffix(gameCollections, "collection");
  const fileName = resolveArchiveFileName(fileNamePrefix, fileNameSuffix);
  return fileName;
}

/**
 * Generates the file name for the atlas.
 * @param atlas - The name of the atlas.
 * @returns The atlas file name.
 */
export function generateAtlasFileName(atlas: string, extension: string = "atlas"): string {
  const fileName = resolveFileName(atlas, extension);
  return fileName;
}

/**
 * Generates the file name for the archive with atlases.
 * @param atlases - The serialized atlases data to generate the file name from.
 * @returns The archive file name.
 */
export function generateAtlasesFileName(atlases: SerializedAtlasData[]) {
  const fileNamePrefix = resolveFileNamePrefix(atlases);
  const fileNameSuffix = resolveFileNameSuffix(atlases, "atlas", "atlases");
  const fileName = resolveArchiveFileName(fileNamePrefix, fileNameSuffix);
  return fileName;
}

/**
 * Generates the file name for the sprite.
 * @param spriteName - The name of the sprite.
 * @returns The sprite file name.
 */
export function generateSpriteFileName(spriteName: string): string {
  const fileName = resolveFileName(spriteName, "png");
  return fileName;
}

/**
 * Generates the file name for the archive with sprites.
 * @param atlases - The serialized atlases data to generate the file name from.
 * @returns The archive file name.
 */
export function generateSpritesFileName(atlases: SerializedAtlasData[]) {
  const fileNamePrefix = resolveFileNamePrefix(atlases);
  const fileName = resolveArchiveFileName(fileNamePrefix, "sprites");
  return fileName;
}

/**
 * Generates the file name for the font.
 * @param fontName - The name of the font.
 * @returns The font file name.
 */
export function generateFontFileName(fontName: string): string {
  const fileName = resolveFileName(fontName, "font");
  return fileName;
}

/**
 * Sanitizes the GUI file name.
 * @param guiFileName - The GUI file name.
 * @returns The sanitized GUI file name.
 */
export function sanitizeGUIFileName(name: string): string {
  const sanitizedName = sanitizeAutoSkipPrefix(name);
  return sanitizedName;
}

/**
 * Removes the autoskip prefix from the GUI file name.
 * @param name - The GUI file name.
 * @returns The sanitized GUI file name.  
 */
function sanitizeAutoSkipPrefix(name: string): string {
  if (name.startsWith(PROJECT_CONFIG.autoskip)) {
    return name.replace(PROJECT_CONFIG.autoskip, "");
  }
  return name;
}

/**
 * Resolves the file name with an extension.
 * @param name - The name of the file.
 * @param extension - The file extension.
 * @returns The full file name.
 */
function resolveFileName(name: string, extension: string): string {
  return `${name}.${extension}`;
}

/**
 * Resolves the archive file name.
 * @param fileNamePrefix - The prefix of the file name.
 * @param fileNameSuffix - The suffix of the file name.
 * @returns The archive file name.
 */
function resolveArchiveFileName(fileNamePrefix: string, fileNameSuffix: string): string {
  return `${fileNamePrefix}.${fileNameSuffix}.zip`;
}

/**
 * Resolves the file name prefix.
 * @param data - The data to resolve the prefix from.
 * @returns The file name prefix.
 */
function resolveFileNamePrefix<T extends { name: string }>(data: T[]): string {
  if (data.length > 1) {
    const { length } = data;
    return `${length}`;
  }
  const [ { name } ] = data; 
  return name;
}

/**
 * Resolves the file name suffix.
 * @param data - The data to resolve the suffix from.
 * @param single - The singular suffix.
 * @param plural - The plural suffix.
 * @returns The file name suffix.
 */
function resolveFileNameSuffix<T extends { name: string }>(data: T[], single: string, plural?: string): string {
  if (data.length > 1) {
    const suffix = plural || `${single}s`;
    return suffix;
  }
  return single;
}

/**
 * Resolves the bundle file name prefix.
 * @param bundle - The bundle data to resolve the prefix from.
 * @returns The bundle file name prefix.
 */
function resolveBundleFileNamePrefix({ gui, gameObjects }: BundleData) {
  const length = calculateBundleSize(gui, gameObjects);
  if (length === 1) {
    if (gui?.length === 1) {
      return gui.filter(node => !node.template)[0].name;
    }
    if (gameObjects?.length === 1) {
      return gameObjects[0].name;
    }
  }
  return `${length}`;
}

/**
 * Calculates the size of the bundle.
 * @param gui - The GUI data.
 * @param gameObjects - The game objects data.
 * @returns The size of the bundle.
 */
function calculateBundleSize(gui?: SerializedGUIData[], gameObjects?: SerializedGameCollectionData[]) {
  const guiLength = (gui?.length || gui?.filter(node => !node.template).length || 0)
  const gameObjectsLength = (gameObjects?.length || 0)
  const length = guiLength + gameObjectsLength;
  return length;
}

/**
 * Resolves the full file path from path to the file and the file name.
 * @param pathSegments - The path segments.
 * @returns The full file path.
 */
function resolveFilePathFromPathName(path: string, fileName: string): string {
  return `${path}/${fileName}`;
}

/**
 * Resolves the full file path from path segments.
 * @param pathSegments - The path segments.
 * @returns The full file path.
 */
function resolveFilePathFromSegments(...pathSegments: string[]): string {
  const filePath = joinPathSegments(pathSegments);
  return filePath;
}

/**
 * Joins the path segments.
 * @param pathSegments - The path segments.
 * @returns The full path.
 */
function joinPathSegments(pathSegments: string[]): string {
  const path = pathSegments.reduce(pathReducer, "");
  return path;
}

/**
 * Reducer function for joining path segments.
 * @param path - The current path.
 * @param segment - The next segment.
 * @returns The updated path.
 */
function pathReducer(path: string, segment: string): string {
  if (!segment) {
    return path;
  }
  const updatedPath = `${path}/${segment}`;
  return updatedPath;
}
