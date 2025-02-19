/**
 * Provides endpoints for managing project-related features, primarily focusing on configuration (e.g., screen size, paths, fonts).
 * @packageDocumentation
 */

import config from "config/config.json";
import { getPluginData, setPluginData } from "utilities/figma";
import { purgeUnusedGUIOverridesPluginData } from "utilities/gui";

/**
 * The project configuration data.
 */
export const PROJECT_CONFIG: ProjectData = {
  screenSize: { ...config.screenSize },
  paths: { ...config.paths },
  fontSize: config.defaultFontSize,
  fontStrokeRatio: config.defaultFontStrokeRatio,
  fontFamilies: [ ...config.defaultFontFamilies ],
  autoskip: config.autoskip,
  omitDefaultValues: config.omitDefaultValues,
}

/**
 * Initializes the project configuration data.
 */
export function initializeProject() {
  const { root: document } = figma;
  const projectData = getPluginData(document, "defoldProject");
  if (projectData) {
    updateProjectProperties(projectData);
  }
}

/**
 * Updates the project configuration data.
 * @param update - Project configuration update to apply.
 */
export function updateProject(update: Partial<ProjectData>) {
  updateProjectProperties(update);
  updateProjectData();
}

/**
 * Updates the project configuration properties.
 * @param update - Project configuration update to apply.
 */
function updateProjectProperties(update: Partial<ProjectData>) {
  updateScreenSize(update.screenSize);
  updatePaths(update.paths);
  updateFontSize(update.fontSize);
  updateFontStrokeRatio(update.fontStrokeRatio);
  updateFontFamilies(update.fontFamilies);
  updateAutoskip(update.autoskip);
  updateomitDefaultValues(update.omitDefaultValues);
}

/**
 * Updates the screen size property.
 * @param screenSize - The screen size property update to apply. 
 */
function updateScreenSize(screenSize?: Vector4) {
  if (screenSize) {
    PROJECT_CONFIG.screenSize = screenSize ? { ...screenSize } : config.screenSize;
  }
}

/**
 * Updates the path properties.
 * @param paths - The path properties update to apply.
 */
function updatePaths(paths?: Partial<ProjectPathData>) {
  if (paths) {
    const entries = Object.entries(paths) as [keyof ProjectPathData, ProjectPathData[keyof ProjectPathData]][];
    entries.forEach(updatePath);
  }
}

/**
 * Updates the particular path property.
 * @param key - The path property key to update.
 * @param updateValue - The new path property value update to apply.
 */
function updatePath([ key, updateValue ]: [ keyof ProjectPathData, ProjectPathData[keyof ProjectPathData] ]) {
  const value = updateValue || updateValue == "" ? updateValue : config.paths[key];
  PROJECT_CONFIG.paths[key] = value;
}

/**
 * Updates the font size property.
 * @param fontSize - The font size property update to apply..
 */
function updateFontSize(fontSize?: number) {
  if (fontSize) {
    PROJECT_CONFIG.fontSize = fontSize;
  }
}

/**
 * Updates the font stroke ratio property.
 * @param fontStrokeRatio - The font stroke ratio property update to apply.
 */
function updateFontStrokeRatio(fontStrokeRatio?: number) {
  if (fontStrokeRatio) {
    PROJECT_CONFIG.fontStrokeRatio = fontStrokeRatio;
  }
}

/**
 * Updates the font families property.
 * @param fontFamilies - The new font families property update to apply.
 */
function updateFontFamilies(fontFamilies?: ProjectFontData[]) {
  if (fontFamilies) {
    PROJECT_CONFIG.fontFamilies = fontFamilies ? [...fontFamilies] : config.defaultFontFamilies;
  }
}

/**
 * Updates the autoskip property.
 * @param autoskip - The new autoskip property update to apply.
 */
function updateAutoskip(autoskip?: string) {
  if (autoskip) {
    PROJECT_CONFIG.autoskip = autoskip;
  }
}

/**
 * Updates the exclude default values property.
 * @param omitDefaultValues - The new exclude default values property update to apply.
 */
function updateomitDefaultValues(omitDefaultValues?: boolean) {
  if (omitDefaultValues !== undefined) {
    PROJECT_CONFIG.omitDefaultValues = omitDefaultValues;
  }
}

/**
 * Updates the project data from the project configuration.
 */
function updateProjectData() {
  const { root: document } = figma;
  const projectData: ProjectData = {
    screenSize: { ...PROJECT_CONFIG.screenSize },
    paths: { ...PROJECT_CONFIG.paths },
    fontSize: PROJECT_CONFIG.fontSize,
    fontStrokeRatio: PROJECT_CONFIG.fontStrokeRatio,
    fontFamilies: [...PROJECT_CONFIG.fontFamilies],
    autoskip: PROJECT_CONFIG.autoskip,
    omitDefaultValues: PROJECT_CONFIG.omitDefaultValues,
  }
  setPluginData(document, { defoldProject: projectData });
}

/**
 * Purges unused project data.
 */
export function purgeUnusedData() {
  purgeUnusedGUIOverridesPluginData();
}
