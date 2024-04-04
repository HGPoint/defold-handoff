import JSZip from "jszip";
import { projectConfig } from "handoff/project";
import { generateAtlasFileName, generateGUIFileName, generateSpriteFileName } from "utilities/path";

function archiveAtlasImage({ name, directory, data }: SerializedSpriteData, imagesFolder: JSZip) {
  const atlasImagesFolder = imagesFolder.folder(directory) || imagesFolder;
  const spriteFileName = generateSpriteFileName(name);
  const blob = new Blob([data], { type: "image/png" });
  atlasImagesFolder.file(spriteFileName, blob);
}

function archiveAtlas({ data, name, images }: SerializedAtlasData, atlasesFolder: JSZip, imagesFolder: JSZip) {
  const atlasFileName = generateAtlasFileName(name);
  atlasesFolder.file(atlasFileName, data);
  images.forEach((image) => archiveAtlasImage(image, imagesFolder));
}

function archiveAtlases(atlases: SerializedAtlasData[], assetsFolder: JSZip) {
  const imagesFolder = assetsFolder.folder(projectConfig.paths.imageAssetsPath) || assetsFolder;
  const atlasesFolder = assetsFolder.folder(projectConfig.paths.atlasAssetsPath) || assetsFolder;
  atlases.forEach((atlas) => { archiveAtlas(atlas, atlasesFolder, imagesFolder); })
}

function archiveGUINode({ name, data }: SerializedGUIData, zip: JSZip) {
  const guiFileName = generateGUIFileName(name);
  zip.file(guiFileName, data);
}

function archiveGUINodes(guiNodes: SerializedGUIData[], assetsFolder: JSZip) {
  guiNodes.forEach((guiNode) => archiveGUINode(guiNode, assetsFolder));
}

export function archiveBundle({ gui, atlases }: BundleData) {
  const zip = new JSZip();
  if (gui) {
    archiveGUINodes(gui, zip);
  }
  if (atlases) {
    const folder = zip.folder(projectConfig.paths.assetsPath) || zip;
    archiveAtlases(atlases, folder);
  }
  return zip.generateAsync({ type: "blob" })
}
