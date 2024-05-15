/**
 * Utility module for handling resource exports.
 * @packageDocumentation
 */

import { archiveBundle } from "utilities/archive";
import copyOnClipboard from "utilities/clipboard";
import download from "utilities/download";

/**
 * Checks if the bundle data contains valid data for exporting components.
 * @param bundle - The bundle data to check.
 * @returns A boolean indicating if the bundle data contains valid component data.
 */
export function isBundleData(bundle?: BundleData): bundle is BundleData {
  return !!bundle && ("gui" in bundle || "atlases" in bundle);
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

/**
 * Copies the serialized data of a GUI component to the clipboard.
 * @param bundle - The bundle data containing GUI components.
 */
export function copyComponent({ bundle }: PluginMessagePayload) {
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
export function exportComponent({ bundle }: PluginMessagePayload) {
  if (isBundleData(bundle)) {
    const { gui } = bundle;
    if (isSerializedGUIData(gui)) {
      const [ guiNode ] = gui;
      const { name: guiNodeName } = guiNode;
      const fileName = `${guiNodeName}.gui`;
      const blob = new Blob([guiNode.data], { type: "text/plain" });
      download(blob, fileName);
    }
  }
}

/**
 * Generates a filename for the archive containing the exported GUI nodes.
 * @param gui - The serialized GUI data.
 * @returns The filename for the exported GUI nodes.
 */
function generateGUINodesFileName(gui: SerializedGUIData[]) {
  const fileName = gui.length > 1 ? gui.length : gui[0].name;
  const suffix = gui.length > 1 ? "nodes" : "node";
  return `${fileName}.${suffix}.zip`;
}

/**
 * Exports multiple GUI components as a single zip file.
 * @param bundle - The bundle data containing GUI components.
 * @param project - The project config data.
 */
export async function exportComponents({ bundle, project }: PluginMessagePayload) {
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
export async function exportGUI(data: PluginMessagePayload) {
  const { bundle } = data;
  if (isBundleData(bundle)) {
    const { gui } = bundle;
    if (gui) {
      if (gui.length > 1) {
        exportComponents(data);
      } else if (gui.length === 1) {
        exportComponent(data);
      }
    }
  }
}

/**
 * Exports resources contained in the bundle data as a single zip file.
 * @param bundle - The bundle data containing resources.
 * @param project - The project config data.
 */
export async function exportResources({ bundle, project }: PluginMessagePayload) {
  if (isBundleData(bundle)) {
    const { gui } = bundle;
    if (project && isSerializedGUIData(gui)) {
      const bundleName = gui.length > 1 ? `${gui.length}nodes` : gui[0].name;
      const fileName = `${bundleName}.resources.zip`;
      const blob = await archiveBundle(bundle, project);
      download(blob, fileName);
    }
  }
}

/**
 * Generates a filename for the exported atlases.
 * @param atlases - The atlases data.
 * @returns The filename for the exported atlases.
 */
function generateAtlasesFileName(atlases: AtlasData[] | SerializedAtlasData[]) {
  const fileName = atlases.length > 1 ? atlases.length : atlases[0].name;
  const suffix = atlases.length > 1 ? "atlases" : "atlas";
  return `${fileName}.${suffix}.zip`;
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
 * Copies the boilerplate scheme code on the clipboard.
 * @param scheme - The extracted scheme data.
 */
export function copyScheme({ scheme }: PluginMessagePayload) {
  if (scheme) {
    copyOnClipboard(scheme);
  }
}
