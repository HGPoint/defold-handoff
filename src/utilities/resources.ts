/**
 * Handles resource handoff.
 * @packageDocumentation
 */

import { archiveBundle, archiveSprites, archiveSpineBundle } from "utilities/archive";
import { createBlob } from "utilities/blob";
import copyOnClipboard from "utilities/clipboard";
import download from "utilities/download";
import { generateAtlasesFileName, generateBundleFileName, generateGameCollectionFileName, generateGameCollectionsFileName, generateGUIFileName, generateGUINodesFileName, generateSpinesFileName, generateSpritesFileName, sanitizeGUIFileName } from "utilities/path";

/**
 * Determines whether the bundle data contains valid data for export.
 * @param bundle - The bundle data to check.
 * @returns True if the bundle data contains valid data for export, otherwise false.
 */
export function isBundleData(bundle?: BundleData): bundle is BundleData {
  return !!bundle &&
    (
      "gui" in bundle ||
      "gameObjects" in bundle ||
      "atlases" in bundle ||
      "sprites" in bundle ||
      "spines" in bundle
    );
}


/**
 * Determines whether the serialized GUI data is valid for export.
 * @param gui - The serialized GUI data to check.
 * @returns True if the serialized GUI data is valid for export, otherwise false.
 */
function isSerializedGUIData(gui?: SerializedGUIData[]): gui is SerializedGUIData[] {
  return !!gui && Array.isArray(gui) && !!gui.length;
}

/**
 * Determines whether the serialized game collection data is valid for export.
 * @param gameObjects - The serialized game collection data to check.
 * @returns True if the serialized game collection data is valid for export, otherwise false.
 */
function isSerializedGameCollectionData(gameObjects?: SerializedGameCollectionData[]): gameObjects is SerializedGameCollectionData[] {
  return !!gameObjects && Array.isArray(gameObjects) && !!gameObjects.length;
}

/**
 * Determines whether the serialized atlas data is valid for export.
 * @param atlases - The serialized atlas data to check.
 * @returns True if the serialized atlas data is valid for export, otherwise false.
 */
function isSerializedAtlasData(atlases?: SerializedAtlasData[]): atlases is SerializedAtlasData[] {
  return !!atlases && Array.isArray(atlases) && !!atlases.length;
}

function isSerializedSpineData(spines?: SerializedSpineData[]): spines is SerializedSpineData[] {
  return !!spines && Array.isArray(spines) && !!spines.length;
}

/**
 * Exports resources contained in the bundle data as a single zip file and triggers a download.
 * @param bundle - The bundle data.
 * @param project - The project configuration data.
 */
export async function exportBundle({ bundle, project }: PluginMessagePayload) {
  if (isBundleData(bundle)) {
    const { gui, gameObjects } = bundle;
    if (project && (isSerializedGUIData(gui) || isSerializedGameCollectionData(gameObjects))) {
      const fileName = generateBundleFileName(bundle);
      const blob = await archiveBundle(bundle, project);
      download(blob, fileName);
    }
  }
}

/**
 * Exports atlases contained in the bundle data as a single zip file and triggers a download.
 * @param bundle - The bundle data.
 * @param project - The project configuration data.
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
 * Exports sprites contained in the bundle data as a single zip file and triggers a download.
 * @param bundle - The bundle data.
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

export async function exportSpines({ bundle }: PluginMessagePayload) {
  if (isBundleData(bundle)) {
    const { spines } = bundle;
    if (isSerializedSpineData(spines)) {
      const fileName = generateSpinesFileName(spines);
      const blob = await archiveSpineBundle(bundle);
      download(blob, fileName);
    }
  }
}

/**
 * Exports GUI components contained in the plugin message payload as a single gui file or a single zip file and triggers a download.
 * @param data - The plugin message payload.
 */
export async function exportGUI(data: PluginMessagePayload) {
  const { bundle } = data;
  if (isBundleData(bundle)) {
    const { gui } = bundle;
    if (gui && gui.length) {
      if (gui.length > 1) {
        exportGUINodes(data);
      } else {
        exportGUINode(data);
      }
    }
  }
}

/**
 * Exports multiple GUI components contained in the bundle data as a single zip file and triggers a download.
 * @param bundle - The bundle data.
 * @param project - The project configuration data.
 */
export async function exportGUINodes({ bundle, project }: PluginMessagePayload) {
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
 * Exports the GUI component as a single gui file and triggers a download.
 * @param bundle - The bundle data.
 */
export function exportGUINode({ bundle }: PluginMessagePayload) {
  if (isBundleData(bundle)) {
    const { gui } = bundle;
    if (isSerializedGUIData(gui)) {
      const [guiNode] = gui;
      const { name: guiNodeName } = guiNode;
      const sanitizedGUIName = sanitizeGUIFileName(guiNodeName);
      const fileName = generateGUIFileName(sanitizedGUIName);
      const blob = createBlob(guiNode.data);
      download(blob, fileName);
    }
  }
}

/**
 * Exports game collections contained in the plugin message payload as a single collection file or a single zip file and triggers a download.
 * @param data - The plugin message payload.
 */
export function exportGameCollection(data: PluginMessagePayload) {
  const { bundle } = data;
  if (isBundleData(bundle)) {
    const { gameObjects } = bundle;
    if (gameObjects) {
      if (gameObjects.length > 1) {
        exportGameObjects(data);
      } else if (gameObjects.length === 1) {
        exportGameObject(data);
      }
    }
  }
}

/**
 * Exports multiple game collections contained in the bundle data as a single zip file and triggers a download.
 * @param bundle - The bundle data.
 * @param project - The project configuration data.
 */
export async function exportGameObjects({ bundle, project }: PluginMessagePayload) {
  if (isBundleData(bundle)) {
    const { gameObjects } = bundle;
    if (project && isSerializedGameCollectionData(gameObjects)) {
      const fileName = generateGameCollectionsFileName(gameObjects);
      const blob = await archiveBundle(bundle, project);
      download(blob, fileName);
    }
  }
}

/**
 * Exports the game collection as a single collection file and triggers a download.
 * @param bundle - The bundle data.
 */
export function exportGameObject({ bundle }: PluginMessagePayload) {
  if (isBundleData(bundle)) {
    const { gameObjects } = bundle;
    if (isSerializedGameCollectionData(gameObjects)) {
      const [gameObject] = gameObjects;
      const { name: gameObjectName } = gameObject;
      const sanitizedGameObjectName = sanitizeGUIFileName(gameObjectName);
      const fileName = generateGameCollectionFileName(sanitizedGameObjectName);
      const blob = createBlob(gameObject.data);
      download(blob, fileName);
    }
  }
}

/**
 * Copies the serialized gui node to the clipboard.
 * @param bundle - The bundle data.
 */
export function copyGUI({ bundle }: PluginMessagePayload) {
  if (isBundleData(bundle)) {
    const { gui } = bundle;
    if (isSerializedGUIData(gui)) {
      const [ guiNode ] = gui;
      copyOnClipboard(guiNode.data);
    }
  }
}

/**
 * Copies the GUI scheme boilerplate Lua code on the clipboard.
 * @param scheme - The extracted scheme.
 */
export function copyGUIScheme({ scheme }: PluginMessagePayload) {
  if (scheme) {
    copyOnClipboard(scheme);
  }
}

/**
 * Copies the serialized game object to the clipboard.
 * @param bundle - The bundle data.
 */
export function copyGameObjects({ bundle }: PluginMessagePayload) {
  if (isBundleData(bundle)) {
    const { gameObjects } = bundle;
    if (isSerializedGameCollectionData(gameObjects)) {
      const [gameObject] = gameObjects;
      copyOnClipboard(gameObject.data);
    }
  }
}
