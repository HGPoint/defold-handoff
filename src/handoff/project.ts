/**
 * Module for managing Defold project configuration data within Figma.
 * @packageDocumentation
 */

import config from "config/config.json";
import { getPluginData, setPluginData } from "utilities/figma";

/**
 * The project configuration data structure.
 */
export const projectConfig: ProjectData = {
  screenSize: { ...config.screenSize },
  paths: { ...config.paths },
  fontSize: config.defaultFontSize,
  fontStrokeRatio: config.defaultFontStrokeRatio,
  fontFamilies: [...config.defaultFontFamilies],
  autoskip: config.autoskip,
}

/**
 * Updates the screen size configuration of the project.
 * @param screenSize - The new screen size configuration to apply.
 */
function updateScreenSize(screenSize?: Vector4) {
  if (screenSize) {
    projectConfig.screenSize = screenSize ? { ...screenSize } : config.screenSize;
  }
}

/**
 * Updates a path configuration of the project.
 * @param updatedPath - The updated path to apply.
 * @param projectPath - The current project path.
 * @param defaultPath - The default path to apply if the updated path is empty.
 * @returns The updated path.
 */
function updatePath(updatedPath: string | undefined, projectPath: string, defaultPath: string) {
  return updatedPath || updatedPath == "" ? updatedPath : projectPath || defaultPath;
}

/**
 * Updates the paths configuration of the project.
 * @param paths - The new paths configuration to apply.
 */
function updatePaths(paths?: Partial<ProjectPathData>) {
  if (paths) {
    projectConfig.paths.assetsPath = paths?.assetsPath || paths?.assetsPath == "" ? paths.assetsPath : config.paths.assetsPath;
    projectConfig.paths.atlasAssetsPath = updatePath(paths?.atlasAssetsPath, projectConfig.paths.atlasAssetsPath, config.paths.atlasAssetsPath);
    projectConfig.paths.imageAssetsPath = updatePath(paths?.imageAssetsPath, projectConfig.paths.imageAssetsPath, config.paths.imageAssetsPath);
    projectConfig.paths.fontAssetsPath = updatePath(paths?.fontAssetsPath, projectConfig.paths.fontAssetsPath, config.paths.fontAssetsPath);
    projectConfig.paths.spineAssetsPath = updatePath(paths?.spineAssetsPath, projectConfig.paths.spineAssetsPath, config.paths.spineAssetsPath);
  }
}

/**
 * Updates the font size configuration of the project.
 * @param fontSize - The new font size configuration to apply.
 */
function updateFontSize(fontSize?: number) {
  if (fontSize) {
    projectConfig.fontSize = fontSize;
  }
}

/**
 * Updates the font stroke ratio configuration of the project.
 * @param fontStrokeRatio - The new font stroke ratio configuration to apply.
 */
function updateFontStrokeRatio(fontStrokeRatio?: number) {
  if (fontStrokeRatio) {
    projectConfig.fontStrokeRatio = fontStrokeRatio;
  }
}

/**
 * Updates the font families configuration of the project.
 * @param fontFamilies - The new font families configuration to apply.
 */
function updateFontFamilies(fontFamilies?: ProjectFontData[]) {
  if (fontFamilies) {
    projectConfig.fontFamilies = fontFamilies ? [...fontFamilies] : config.defaultFontFamilies;
  }
}

/**
 * Updates the autoskip configuration of the project.
 * @param autoskip - The new autoskip configuration to apply.
 */
function updateAutoskip(autoskip?: string) {
  if (autoskip) {
    projectConfig.autoskip = autoskip;
  }
}

/**
 * Updates the project data.
 * @param data - Project data update.
 */
function updateProjectData(data: Partial<ProjectData>) {
  updateScreenSize(data.screenSize);
  updatePaths(data.paths);
  updateFontSize(data.fontSize);
  updateFontStrokeRatio(data.fontStrokeRatio);
  updateFontFamilies(data.fontFamilies);
  updateAutoskip(data.autoskip);
}

/**
 * Initializes the project configuration data.
 */
export function initializeProject() {
  const { root: document } = figma;
  const projectData = getPluginData(document, "defoldProject");
  if (projectData) {
    updateProjectData(projectData);
  }
}

/**
 * Updates the project configuration data.
 * @param data - Project configuration update.
 */
export function updateProject(data: Partial<ProjectData>) {
  updateProjectData(data);
  const { root: document } = figma;
  const projectData = {
    screenSize: { ...projectConfig.screenSize },
    paths: { ...projectConfig.paths },
    fontSize: projectConfig.fontSize,
    fontStrokeRatio: projectConfig.fontStrokeRatio,
    fontFamilies: [...projectConfig.fontFamilies],
    autoskip: projectConfig.autoskip,
  }
  setPluginData(document, { defoldProject: projectData });
}