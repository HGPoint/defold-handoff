import { bundleResources } from "./bundle";
import copyOnClipboard from "./clipboard";
import download from "./download";

export function hasGUIWithAtlases({ gui, atlases }: PluginMessagePayload) {
  return !!gui && !!atlases
}

export function hasGUI({ gui }: PluginMessagePayload) {
  return !!gui
}

export function hasAtlases({ atlases }: PluginMessagePayload) {
  return !!atlases
}

export function copyComponent({ gui }: PluginMessagePayload) {
  if (gui) {
    const [ guiNode ] = gui;
    copyOnClipboard(guiNode.data);
  }
}

export function exportComponent({ gui }: PluginMessagePayload) {
  if (gui) {
    const [ guiNode ] = gui;
    const { name: guiNodeName } = guiNode;
    const fileName = `${guiNodeName}.gui`;
    const blob = new Blob([guiNode.data], { type: 'text/plain' });
    download(blob, fileName);
  }
}

export async function exportResources(data: PluginMessagePayload) {
  if (hasGUIWithAtlases(data)) {
    const [{ name: bundleName }] = data.gui;
    const fileName = `${bundleName}.bundle.zip`;
    const blob = await bundleResources(data);
    download(blob, fileName);
  }
}

function atlasesFileNameReducer(fileName: string, { name }: AtlasData) {
  return `${fileName}${!fileName ? "" : "-"}${name}`
}

function generateAtlasesFileName(atlases: AtlasData[]) {
  const suffix = atlases.length > 1 ? "atlases" : "atlas";
  const fileName = atlases.reduce(atlasesFileNameReducer, "");
  return `${fileName}.${suffix}.zip`;

}

export async function exportAtlases(data: PluginMessagePayload) {
  if (hasAtlases(data)) {
    const fileName = generateAtlasesFileName(data.atlases);
    const blob = await bundleResources(data);
    download(blob, fileName);
  }
}