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

function archiveGUINode({ name, data }: SerializedGUIData, zip: JSZip) {
  const guiFileName = generateGUIFileName(name);
  zip.file(guiFileName, data);
}

function archiveGUINodes(guiNodes: SerializedGUIData[], zip: JSZip) {
  guiNodes.forEach((guiNode) => archiveGUINode(guiNode, zip));
}

export function archiveBundle({ gui, atlases }: BundleData) {
  const zip = new JSZip();
  if (gui) {
    archiveGUINodes(gui, zip);
  }
  if (atlases) { 
    archiveAtlases(atlases, zip);
  }
  return zip.generateAsync({ type: "blob" })
}
