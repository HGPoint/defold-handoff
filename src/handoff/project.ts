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
 * Updates the paths configuration of the project.
 * @param paths - The new paths configuration to apply.
 * TODO: If paths isn't in update, before settings in to the default value, check if it's already set in the projectConfig.
 */
function updatePaths(paths?: Partial<ProjectPathData>) {
  if (paths) {
    projectConfig.paths.assetsPath = paths?.assetsPath || paths?.assetsPath == "" ? paths.assetsPath : config.paths.assetsPath;
    projectConfig.paths.atlasAssetsPath = paths?.atlasAssetsPath || config.paths.atlasAssetsPath;
    projectConfig.paths.imageAssetsPath = paths?.imageAssetsPath || config.paths.imageAssetsPath;
    projectConfig.paths.fontAssetsPath = paths?.fontAssetsPath || config.paths.fontAssetsPath;
    projectConfig.paths.spineAssetsPath = paths?.spineAssetsPath || config.paths.spineAssetsPath;
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
    fontFamilies: [...projectConfig.fontFamilies],
    autoskip: projectConfig.autoskip,
  }
  setPluginData(document, { defoldProject: projectData });
}