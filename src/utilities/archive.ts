import JSZip from "jszip";
import config from "config/config.json";
import { generateAtlasFileName, generateGUIFileName, generateSpriteFileName } from "utilities/path";

function archiveAtlasImage({ name, data }: SerializedSpriteData, zip: JSZip) {
  const spriteFileName = generateSpriteFileName(name);
  const blob = new Blob([data], { type: "image/png" });
  zip.file(spriteFileName, blob);
}

function archiveAtlas({ data, name, images }: SerializedAtlasData, zip: JSZip) {
  const atlasFileName = generateAtlasFileName(name);
  zip.file(atlasFileName, data);
  const folder = zip.folder(name) || zip;
  images.forEach((image) => archiveAtlasImage(image, folder));
}

function archiveAtlases(atlases: SerializedAtlasData[], zip: JSZip) {
  const folder = zip.folder(config.paths.atlasAssetsPath) || zip;
  atlases.forEach((atlas) => { archiveAtlas(atlas, folder); })
}

function archiveGUI(gui: SerializedGUIData[], zip: JSZip) {
  const [guiNode] = gui;
  const guiFileName = generateGUIFileName(guiNode.name);
  zip.file(guiFileName, guiNode.data);
}

export function archiveBundle({ gui, atlases }: BundleData) {
  const zip = new JSZip();
  if (gui) {
    archiveGUI(gui, zip);
  }
  if (atlases) { 
    archiveAtlases(atlases, zip);
  }
  return zip.generateAsync({ type: "blob" })
}
