import config from "config/config.json";
import { getPluginData, setPluginData } from "utilities/figma";

export const projectConfig: ProjectData = {
  screenSize: { ...config.screenSize },
  paths: { ...config.paths },
  fontFamilies: [...config.fontFamilies],
}

function updateScreenSize(screenSize?: Vector4) {
  if (screenSize) {
    projectConfig.screenSize = screenSize ? { ...screenSize } : config.screenSize;
  }
}

function updatePaths(paths?: Partial<ProjectPathData>) {
  if (paths) {
    projectConfig.paths.assetsPath = paths?.assetsPath || config.paths.assetsPath;
    projectConfig.paths.atlasAssetsPath = paths?.atlasAssetsPath || config.paths.atlasAssetsPath;
    projectConfig.paths.imageAssetsPath = paths?.imageAssetsPath || config.paths.imageAssetsPath;
    projectConfig.paths.fontAssetsPath = paths?.fontAssetsPath || config.paths.fontAssetsPath;
    projectConfig.paths.spineAssetsPath = paths?.spineAssetsPath || config.paths.spineAssetsPath;
  }
}

function updateFontFamilies(fontFamilies?: string[]) {
  if (fontFamilies) {
    projectConfig.fontFamilies = fontFamilies ? [...fontFamilies] : config.fontFamilies;
  }
}

function updateProjectData(data: Partial<ProjectData>) {
  updateScreenSize(data.screenSize);
  updatePaths(data.paths);
  updateFontFamilies(data.fontFamilies);
}

export function initializeProject() {
  const { root: document } = figma;
  const projectData = getPluginData(document, "defoldProject");
  if (projectData) {
    updateProjectData(projectData);
  }
  console.log(projectConfig);
}

export function updateProject(data: Partial<ProjectData>) {
  updateProjectData(data);
  const { root: document } = figma;
  const projectData = {
    screenSize: { ...projectConfig.screenSize },
    paths: { ...projectConfig.paths },
    fontFamilies: [...projectConfig.fontFamilies],
  }
  setPluginData(document, { defoldProject: projectData });
}