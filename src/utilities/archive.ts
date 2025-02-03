/**
 * Handles file archiving using JSZip
 * @packageDocumentation
 */

import config from "config/config.json";
import JSZip from "jszip";
import { createBlob } from "utilities/blob";
import { generateAtlasFileName, generateGUIPath, generateGameCollectionPath, generateSpineFileName, generateSpriteFileName, generateTemplatePath } from "utilities/path";

/**
 * Archives the bundled into a zip archive.
 * @param bundle - The bundle data to be archived.
 * @returns The blob containing the zip archive.
 */
export function archiveBundle({ gui, gameObjects, atlases }: BundleData, projectConfig: Partial<ProjectData>) {
  const zip = new JSZip();
  if (gui) {
    archiveGUI(gui, zip);
  }
  if (gameObjects) {
    archiveGameObjects(gameObjects, zip);
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

/**
 * Archives the sprite into the images folder.
 * @param spriteData - The sprite to be archived.
 * @param imagesFolder - The folder in archive.
 */
function archiveAtlasImage({ name, directory, data }: SerializedSpriteData, imagesFolder: JSZip) {
  if (data) {
    const atlasImagesFolder = imagesFolder.folder(directory) || imagesFolder;
    const spriteFileName = generateSpriteFileName(name);
    const blob = createBlob(data);
    atlasImagesFolder.file(spriteFileName, blob);
  }
}

/**
 * Archives game objects into the assets folder.
 * @param gameObjects - The game objects to be archived.
 * @param assetsFolder - The folder in archive.
 */
function archiveGameObjects(gameObjects: SerializedGameCollectionData[], assetsFolder: JSZip) {
  gameObjects.forEach((gameObject) => archiveGameObject(gameObject, assetsFolder));
}

/**
 * Archives a game object into assets folder.
 * @param gameObjectData - The game object to be archived.
 * @param assetsFolder - The folder in archive.
 */
function archiveGameObject({ name, data, filePath }: SerializedGameCollectionData, assetsFolder: JSZip) {
  const gameCollectionFileName = generateGameCollectionPath(name, filePath);
  assetsFolder.file(gameCollectionFileName, data);
}

/**
 * Archives GUI into the assets folder.
 * @param guiNodes - The GUI to be archived.
 * @param assetsFolder - The folder in archive.
 */
function archiveGUI(guiNodes: SerializedGUIData[], assetsFolder: JSZip) {
  guiNodes.forEach((guiNode) => archiveGUINode(guiNode, assetsFolder));
}

/**
 * Archives a GUI node into the provided assets folder within the zip archive.
 * @param guiNodeData - The serialized GUI node to be archived.
 * @param assetsFolder - The folder in archive.
 */
function archiveGUINode({ name, data, template, templateName, templatePath, filePath }: SerializedGUIData, assetsFolder: JSZip) {
  const isTemplate = template && templateName && templatePath;
  const guiFilePath = isTemplate ? generateTemplatePath(templatePath, templateName) : generateGUIPath(name, filePath);
  assetsFolder.file(guiFilePath, data);
}

/**
 * Archives atlases into the assets folder.
 * @param atlases - The atlases to be archived.
 * @param assetsFolder - The folder in archive.
 * @param paths - The project paths.
 */
function archiveAtlases(atlases: SerializedAtlasData[], assetsFolder: JSZip, paths: ProjectPathData) {
  const imagesFolder = assetsFolder.folder(paths.imageAssetsPath) || assetsFolder;
  const atlasesFolder = assetsFolder.folder(paths.atlasAssetsPath) || assetsFolder;
  atlases.forEach((atlas) => { archiveAtlas(atlas, atlasesFolder, imagesFolder); })
}

/**
 * Archives the atlas into the atlases folder.
 * @param atlasData - The atlas to be archived.
 * @param atlasesFolder - The folder in archive for atlases.
 * @param imagesFolder - The folder in archive for images.
 */
function archiveAtlas({ data, name, images }: SerializedAtlasData, atlasesFolder: JSZip, imagesFolder: JSZip) {
  const atlasFileName = generateAtlasFileName(name);
  atlasesFolder.file(atlasFileName, data);
  images.forEach((image) => archiveAtlasImage(image, imagesFolder));
}

/**
 * Archives sprites into a zip archive.
 * @param bundle - The bundle data containing sprites to be archived.
 * @returns The blob containing the zip archive.
 */
export function archiveSprites({ atlases }: BundleData) {
  const zip = new JSZip();
  if (atlases && atlases.length > 0) {
    atlases.forEach((atlas) => { archiveSpriteAtlas(atlas, zip) })
  }
  return zip.generateAsync({ type: "blob" })
}

/**
 * Archives the sprite into the atlas folder.
 * @param atlas - The atlas data containing the sprites to be archived.
 * @param zip - The zip archive.
 */
function archiveSpriteAtlas(atlas: SerializedAtlasData, zip: JSZip) {
  const folder = zip.folder(atlas.name) || zip;
  atlas.images.forEach((image) => { archiveSpriteImage(image, folder) });
}

/**
 * Archives the sprite into the atlas folder.
 * @param spriteData - The sprite to be archived.
 * @param folder - The folder in archive.
 */
function archiveSpriteImage({ name, data }: SerializedSpriteData, folder: JSZip) {
  if (data) {
    const spriteFileName = generateSpriteFileName(name);
    const blob = createBlob(data);
    folder.file(spriteFileName, blob);
  }
}

export function archiveSpineBundle({ spines, atlases }: BundleData) {
  const zip = new JSZip();
  if (spines) {
    archiveSpines(spines, zip);
  }
  if (atlases && atlases.length > 0) {
    const folder = zip.folder("images") || zip;
    if (atlases && atlases.length > 0) {
      atlases.forEach((atlas) => { archiveSpineImages(atlas, folder) });
    }
  }
  return zip.generateAsync({ type: "blob" })
}

function archiveSpineImages(atlas: SerializedAtlasData, folder: JSZip) {
  atlas.images.forEach((image) => { archiveSpriteImage(image, folder) });
}

function archiveSpines(spines: SerializedSpineData[], assetsFolder: JSZip) {
  spines.forEach((spine) => archiveSpine(spine, assetsFolder));
}

function archiveSpine(spine: SerializedSpineData, assetsFolder: JSZip) {
  const spineFileName = generateSpineFileName(spine.name);
  assetsFolder.file(spineFileName, spine.data);
}