/**
 * Utility module for handling resource exports.
 * @packageDocumentation
 */

import { generateGUIFileName, generateGameCollectionFileName, generateGUINodesFileName, generateAtlasesFileName, generateSpritesFileName, generateGameCollectionsFileName, sanitizeFileName } from "utilities/path";
import { archiveBundle, archiveSprites } from "utilities/archive";
import copyOnClipboard from "utilities/clipboard";
import download from "utilities/download";

/**
 * Checks if the bundle data contains valid data for exporting components.
 * @param bundle - The bundle data to check.
 * @returns A boolean indicating if the bundle data contains valid component data.
 */
export function isBundleData(bundle?: BundleData): bundle is BundleData {
  return !!bundle && ("gui" in bundle || "gameObjects" in bundle || "atlases" in bundle);
}

/**
 * Checks if the data contains valid data for exporting atlases.
 * @param bundle - The bundle data to check.
 * @returns A boolean indicating if the bundle data contains valid atlas data.
 */
function isSerializedAtlasData(atlases?: SerializedAtlasData[]): atlases is SerializedAtlasData[] {
  return !!atlases && Array.isArray(atlases);
}

/**
 * Checks if the data contains valid data for exporting GUI components.
 * @param gui - The GUI data to check.
 * @returns A boolean indicating if the bundle data contains valid GUI data.
 */
function isSerializedGUIData(gui?: SerializedGUIData[]): gui is SerializedGUIData[] {
  return !!gui && Array.isArray(gui);
}

function isSerializedGameCollectionData(gameObjects?: SerializedGameCollectionData[]): gameObjects is SerializedGameCollectionData[] {
  return !!gameObjects && Array.isArray(gameObjects);
}

/**
 * Copies the serialized data of a GUI component to the clipboard.
 * @param bundle - The bundle data containing GUI components.
 */
export function copyGUINodes({ bundle }: PluginMessagePayload) {
  if (isBundleData(bundle)) {
    const { gui } = bundle;
    if (isSerializedGUIData(gui)) {
      const [ guiNode ] = gui;
      copyOnClipboard(guiNode.data);
    }
  }
}

/**
 * Exports a GUI component as a .gui file.
 * @param bundle - The bundle data containing GUI components.
 */
export function exportGUIComponent({ bundle }: PluginMessagePayload) {
  if (isBundleData(bundle)) {
    const { gui } = bundle;
    if (isSerializedGUIData(gui)) {
      const [ guiNode ] = gui;
      const { name: guiNodeName } = guiNode;
      const sanitizedGUIName = sanitizeFileName(guiNodeName);
      const fileName = generateGUIFileName(sanitizedGUIName);
      const blob = new Blob([guiNode.data], { type: "text/plain" });
      download(blob, fileName);
    }
  }
}

/**
 * Exports multiple GUI components as a single zip file.
 * @param bundle - The bundle data containing GUI components.
 * @param project - The project config data.
 */
export async function exportGUIComponents({ bundle, project }: PluginMessagePayload) {
  if (isBundleData(bundle)) {
    const { gui } = bundle;
    if (project && isSerializedGUIData(gui)) {
      const fileName = generateGUINodesFileName(gui);
      const blob = await archiveBundle(bundle, project);
      download(blob, fileName);
    }
  }
}

/**
 * Exports GUI components as files.
 * @param data - The plugin message payload.
 */
export async function exportGUINodes(data: PluginMessagePayload) {
  const { bundle } = data;
  if (isBundleData(bundle)) {
    const { gui } = bundle;
    if (gui) {
      if (gui.length > 1) {
        exportGUIComponents(data);
      } else if (gui.length === 1) {
        exportGUIComponent(data);
      }
    }
  }
}

function resolveBundleName({ gui, gameObjects }: BundleData) {
  const length = (gui?.length || gui?.filter(node => !node.template).length || 0) + (gameObjects?.length || 0);
  if (length === 1) {
    if (gui?.length === 1) {
      return gui.filter(node => !node.template)[0].name;
    }
    if (gameObjects?.length === 1) {
      return gameObjects[0].name;
    } 
  }
  return (gui?.length || 0) + (gameObjects?.length || 0);
}

/**
 * Exports resources contained in the bundle data as a single zip file.
 * @param bundle - The bundle data containing resources.
 * @param project - The project config data.
 */
export async function exportBundle({ bundle, project }: PluginMessagePayload) {
  if (isBundleData(bundle)) {
    const { gui } = bundle;
    if (project && isSerializedGUIData(gui)) {
      const bundleName = resolveBundleName(bundle);
      const fileName = `${bundleName}.resources.zip`;
      const blob = await archiveBundle(bundle, project);
      download(blob, fileName);
    }
  }
}

/**
 * Exports atlases contained in the bundle data as a single zip file.
 * @param bundle - The bundle data containing atlases.
 * @param project - The project config data.
 */
export async function exportAtlases({ bundle, project }: PluginMessagePayload) {
  if (isBundleData(bundle)) {
    const { atlases } = bundle;
    if (project && isSerializedAtlasData(atlases)) {
      const fileName = generateAtlasesFileName(atlases);
      const blob = await archiveBundle(bundle, project);
      download(blob, fileName);
    }
  }
}

/**
 * Exports sprites contained in the bundle data as a single zip file.
 * @param bundle - The bundle data containing atlases.
 */
export async function exportSprites({ bundle }: PluginMessagePayload) {
  if (isBundleData(bundle)) {
    const { atlases } = bundle;
    if (isSerializedAtlasData(atlases)) {
      const fileName = generateSpritesFileName(atlases);
      const blob = await archiveSprites(bundle);
      download(blob, fileName);
    }
  }
}

/**
 * Copies the boilerplate scheme code on the clipboard.
 * @param scheme - The extracted scheme data.
 */
export function copyGUINodeScheme({ scheme }: PluginMessagePayload) {
  if (scheme) {
    copyOnClipboard(scheme);
  }
}

export function copyGameObjects({ bundle }: PluginMessagePayload) {
  if (isBundleData(bundle)) {
    const { gameObjects } = bundle;
    if (isSerializedGameCollectionData(gameObjects)) {
      const [ gameObject ] = gameObjects;
      copyOnClipboard(gameObject.data);
    }
  }
}

export function exportGameObjectsComponent({ bundle }: PluginMessagePayload) {
  if (isBundleData(bundle)) {
    const { gameObjects } = bundle;
    if (isSerializedGameCollectionData(gameObjects)) {
      const [ gameObject ] = gameObjects;
      const { name: gameObjectName } = gameObject;
      const sanitizedGameObjectName = sanitizeFileName(gameObjectName);
      const fileName = generateGameCollectionFileName(sanitizedGameObjectName);
      const blob = new Blob([gameObject.data], { type: "text/plain" });
      download(blob, fileName);
    }
  }
}

export async function exportGameObjectsComponents({ bundle, project }: PluginMessagePayload) {
  if (isBundleData(bundle)) {
    const { gameObjects } = bundle;
    if (project && isSerializedGameCollectionData(gameObjects)) {
      const fileName = generateGameCollectionsFileName(gameObjects);
      const blob = await archiveBundle(bundle, project);
      download(blob, fileName);
    }
  }
}

export function exportGameObjects(data: PluginMessagePayload) {
  const { bundle } = data;
  if (isBundleData(bundle)) {
    const { gameObjects } = bundle;
    if (gameObjects) {
      if (gameObjects.length > 1) {
        exportGameObjectsComponents(data);
      } else if (gameObjects.length === 1) {
        exportGameObjectsComponent(data);
      }
    }
  }
}