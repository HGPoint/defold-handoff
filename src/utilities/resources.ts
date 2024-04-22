import { archiveBundle } from "utilities/archive";
import copyOnClipboard from "utilities/clipboard";
import download from "utilities/download";

function isBundleData(bundle?: BundleData): bundle is BundleData {
  return !!bundle && ("gui" in bundle || "atlases" in bundle);
}

function isSerializedAtlasData(atlases?: SerializedAtlasData[]): atlases is SerializedAtlasData[] {
  return !!atlases && Array.isArray(atlases);
}

function isSerializedGUIData(gui?: SerializedGUIData[]): gui is SerializedGUIData[] {
  return !!gui && Array.isArray(gui);
}

export function copyComponent({ bundle }: PluginMessagePayload) {
  if (isBundleData(bundle)) {
    const { gui } = bundle;
    if (isSerializedGUIData(gui)) {
      const [ guiNode ] = gui;
      copyOnClipboard(guiNode.data);
    }
  }
}

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

function guiNodesFileNameReducer(fileName: string, { name }: SerializedGUIData) {
  return `${fileName}${!fileName ? "" : "-"}${name}`
}

function generateGUINodesFileName(gui: SerializedGUIData[]) {
  const suffix = gui.length > 1 ? "nodes" : "node";
  const fileName = gui.reduce(guiNodesFileNameReducer, "");
  return `${fileName}.${suffix}.zip`;
}

export async function exportComponents({ bundle }: PluginMessagePayload) {
  if (isBundleData(bundle)) {
    const { gui } = bundle;
    if (isSerializedGUIData(gui)) {
      const fileName = generateGUINodesFileName(gui);
      const blob = await archiveBundle(bundle);
      download(blob, fileName);
    }
  }
}

export async function exportResources({ bundle }: PluginMessagePayload) {
  if (isBundleData(bundle)) {
    const { gui } = bundle;
    if (isSerializedGUIData(gui)) {
      const [{ name: bundleName }] = gui;
      const fileName = `${bundleName}.resources.zip`;
      const blob = await archiveBundle(bundle);
      download(blob, fileName);
    }
  }
}

function atlasesFileNameReducer(fileName: string, { name }: AtlasData | SerializedAtlasData) {
  return `${fileName}${!fileName ? "" : "-"}${name}`
}

function generateAtlasesFileName(atlases: AtlasData[] | SerializedAtlasData[]) {
  const suffix = atlases.length > 1 ? "atlases" : "atlas";
  const fileName = atlases.reduce(atlasesFileNameReducer, "");
  return `${fileName}.${suffix}.zip`;
}

export async function exportAtlases({ bundle }: PluginMessagePayload) {
  if (isBundleData(bundle)) {
    const { atlases } = bundle;
    if (isSerializedAtlasData(atlases)) {
      const fileName = generateAtlasesFileName(atlases);
      const blob = await archiveBundle(bundle);
      download(blob, fileName);
    }
  }
}

export function copyScheme({ scheme }: PluginMessagePayload) {
  if (scheme) {
    copyOnClipboard(scheme);
  }
}
