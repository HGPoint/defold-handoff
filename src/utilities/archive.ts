/**
 * Utility module for handling archives. It utilizes JSZip library for creating zip archives.
 */

import config from "config/config.json";
import JSZip from "jszip";
import { generateAtlasFileName, generateGUIPath, generateSpriteFileName, generateTemplatePath } from "utilities/path";

/**
 * Archives an individual atlas image into the provided images folder within the zip archive.
 * @param spriteData - The data of the sprite to be archived.
 * @param imagesFolder - The folder where the images for the particular atlas are stored within the zip archive.
 */
function archiveAtlasImage({ name, directory, data }: SerializedSpriteData, imagesFolder: JSZip) {
  const atlasImagesFolder = imagesFolder.folder(directory) || imagesFolder;
  const spriteFileName = generateSpriteFileName(name);
  const blob = new Blob([data], { type: "image/png" });
  atlasImagesFolder.file(spriteFileName, blob);
}

/**
 * Archives an atlas along with its images into the provided atlases and images folders within the zip archive.
 * @param atlasData - The serialized atlas to be archived.
 * @param atlasesFolder - The folder where atlases are stored within the zip archive.
 * @param imagesFolder - The folder where images are stored within the zip archive.
 */
function archiveAtlas({ data, name, images }: SerializedAtlasData, atlasesFolder: JSZip, imagesFolder: JSZip) {
  const atlasFileName = generateAtlasFileName(name);
  atlasesFolder.file(atlasFileName, data);
  images.forEach((image) => archiveAtlasImage(image, imagesFolder));
}

/**
 * Archives atlases into the provided assets folder within the zip archive.
 * @param atlases - The array of serialized atlases to be archived.
 * @param assetsFolder - The folder where assets are stored within the zip archive.
 */
function archiveAtlases(atlases: SerializedAtlasData[], assetsFolder: JSZip, paths: ProjectPathData) {
  const imagesFolder = assetsFolder.folder(paths.imageAssetsPath) || assetsFolder;
  const atlasesFolder = assetsFolder.folder(paths.atlasAssetsPath) || assetsFolder;
  atlases.forEach((atlas) => { archiveAtlas(atlas, atlasesFolder, imagesFolder); })
}

/**
 * Archives a GUI node into the provided assets folder within the zip archive.
 * @param guiNodeData - The serialized GUI node to be archived.
 * @param assetsFolder - The folder where assets are stored within the zip archive.
 */
function archiveGUINode({ name, data, template, templateName, templatePath, filePath }: SerializedGUIData, assetsFolder: JSZip) {
  const guiFilePath = template && templateName && templatePath ? generateTemplatePath(templatePath, templateName) : generateGUIPath(name, filePath);
  assetsFolder.file(guiFilePath, data);
}

/**
 * Archives GUI nodes into the provided assets folder within the zip archive.
 * @param guiNodes - The array of serialized GUI nodes to be archived.
 * @param assetsFolder - The folder where assets are stored within the zip archive.
 */
function archiveGUINodes(guiNodes: SerializedGUIData[], assetsFolder: JSZip) {
  guiNodes.forEach((guiNode) => archiveGUINode(guiNode, assetsFolder));
}

/**
 * Archives the bundled data, including GUI nodes and atlases, into a zip archive.
 * @param bundle - The bundle data to be archived.
 * @returns A Blob containing the zip archive.
 */
export function archiveBundle({ gui, atlases }: BundleData, projectConfig: Partial<ProjectData>) {
  const zip = new JSZip();
  if (gui) {
    archiveGUINodes(gui, zip);
  }
  if (atlases && atlases.length > 0) {
    const paths = {
      ...config.paths,
      ...projectConfig.paths,
    }
    const folder = zip.folder(paths.assetsPath) || zip;
    archiveAtlases(atlases, folder, paths);
  }
  return zip.generateAsync({ type: "blob" })
}
