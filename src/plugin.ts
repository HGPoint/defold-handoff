/**
 * The entry point for the Figma plugin application. It manages business logic, including atlases, GUI nodes, game objects, and the overall project.
 * @packageDocumentation
 */

import config from "config/config.json";
import { addSprites, copyAtlases, createAtlas, exportAtlases, exportGameCollectionAtlases, exportGUIAtlases, fitAtlases, fixAtlases, removeAtlases, sortAtlasesAlphabetically, sortAtlasesBySize, tryExtractSprite, tryRestoreAtlases, updateAtlas } from "handoff/atlas";
import { exportBareBundle, exportBundle } from "handoff/bundle";
import { copyGameCollection, exportGameCollections, fixGameObjects, removeGameObjects, updateGameObject } from "handoff/gameCollection";
import { copyGUI, copyGUIScheme, exportGUI, fixGUI, logGUI, removeGUI, resetGUIOverrides, resizeGUIToScreen, tryFixGUIText, tryForceGUIChildrenOnScreen, tryMatchGUINodeToGUIChild, tryMatchGUINodeToGUIParent, updateGUI, updateGUINode } from "handoff/gui";
import { initializeProject, PROJECT_CONFIG, purgeUnusedData, updateProject } from "handoff/project";
import { exportGUIPSD } from "handoff/psd";
import { removeSections, updateSection } from "handoff/section";
import { exportGUISpineAttachments, exportGUISpines } from "handoff/spine";
import delay from "utilities/delay";
import { processDocumentChanges } from "utilities/document";
import { processError } from "utilities/error";
import { selectFigmaLayer, selectFigmaLayers } from "utilities/figma";
import { DEFAULT_PACK_OPTIONS } from "utilities/guiExport";
import { convertSelectionDataToSelectionUIData, pickAtlasesFromSelectionData, pickFirstAtlasFromSelectionData, pickFirstGameObjectFromSelectionData, pickFirstGUINodeFromSelectionData, pickGameObjectsFromSelectionData, pickGUIFromSelectionData, pickLayersFromSelectionData, reduceAtlasesFromSelectionData, reduceSelectionDataFromSelection } from "utilities/selection";
import { tryRestoreSlice9Placeholder } from "utilities/slice9";

let SELECTION: SelectionData = { gui: [], atlases: [], layers: [], sections: [], gameObjects: [] };
let SELECTION_VERSION = 0;
let LAST_EXTRACTED_IMAGE_LAYER_ID: string | null = null;

/**
 * Initializes the plugin application.
 */
async function initializePlugin(): Promise<void> {
  await figma.loadAllPagesAsync();
  initializeUI();
  initializeProject();
  subscribeToMessages();
  updateSelection();
}

/**
 * Initializes the plugin's UI.
 */
function initializeUI(): void {
  const html = __html__.replace("{{defoldHandoffUIMode}}", `"${figma.command}"`);
  figma.showUI(html, { width: 400, height: 600 });
}

/**
 * Initializes the plugin message listeners.
 */
function subscribeToMessages(): void {
  figma.on("selectionchange", onSelectionChange);
  figma.on("documentchange", onDocumentChange);
  figma.ui.on("message", onUIMessage);
}

/**
 * Handler function for selection changes.
 */
function onSelectionChange(): void {
  updateSelection();
  tryResetLastExtractedImage();
}

/**
 * Handler function for document changes.
 * @param event - The document change event.
 */
function onDocumentChange(event: DocumentChangeEvent): void {
  processDocumentChanges(event);
  updateSelection();
}

/**
 * Handler function for messages from the UI application.
 * @param message - The message from the UI application.
 * @async
 */
function onUIMessage(message: PluginMessage): void {
  try {
    processUIMessage(message);
  } catch (error) {
    processError(error as Error);
  }
}

/**
 * Attempts to post a message to the the UI application.
 * @param type - The message type.
 * @param data - The message data.
 */
function tryPostMessageToUI(type: PluginMessageAction, data: PluginMessagePayload): void {
  if (isUIAvailable()) {
    figma.ui.postMessage({ type, data });
  }
}


/**
 * Checks if the plugin UI is shown.
 * @returns True if the plugin UI is shown, otherwise false.
 */
function isUIAvailable(): boolean {
  return !!figma.ui;
}

/**
 * Resizes the plugin UI.
 * @param width - The width of the plugin UI.
 * @param height - The height of the plugin UI.
 */
function resizeUI({ width, height }: { width: number, height: number }): void {
  figma.ui.resize(width, height);
}

/**
 * Updates the selection data and sends it to the UI application.
 * @async
 */
async function updateSelection(): Promise<void> {
  SELECTION_VERSION += 1;
  const version = SELECTION_VERSION;
  SELECTION = reduceSelectionDataFromSelection();
  const selectionUI = await convertSelectionDataToSelectionUIData(SELECTION);
  if (version === SELECTION_VERSION) {
    tryPostMessageToUI("selectionChanged", { selection: selectionUI });
  }
}

/**
 * Attempts to extract an image from a sprite layer.
 * @param layer - The Figma layer to attempt to extract the image from.
 * @returns The extracted image.
 * @async
 */
async function tryExtractImage(layer: SceneNode): Promise<WithNull<Uint8Array<ArrayBufferLike>>> {
  if (shouldExtractSprite(layer)) {
    return extractImage(layer);
  }
  return null;
}

/**
 * Determines if a sprite should be extracted.
 * @param layer - The Figma layer to check.
 * @returns True if the sprite should be extracted, otherwise false.
 */
function shouldExtractSprite(layer: SceneNode): boolean {
  return layer.id !== LAST_EXTRACTED_IMAGE_LAYER_ID;
}

async function extractImage(layer: SceneNode): Promise<WithNull<Uint8Array<ArrayBufferLike>>> {
  LAST_EXTRACTED_IMAGE_LAYER_ID = layer.id;
  const image = await tryExtractSprite(layer);
  return image;
}

function tryResetLastExtractedImage(): void {
  if (shouldResetLastExtractedImage()) {
    resetLastExtractedImage();
  }
}

function shouldResetLastExtractedImage(): boolean {
  return !!LAST_EXTRACTED_IMAGE_LAYER_ID && !SELECTION.gui.length;
}

function resetLastExtractedImage(): void {
  LAST_EXTRACTED_IMAGE_LAYER_ID = null;
}

/**
 * Processes a message from the UI application.
 * @param message - The message from the UI application.
 */
function processUIMessage(message: PluginMessage): void {
  const { type, data } = message;
  if (type === "updateProject" && data?.project) {
    onUpdateProject(data.project);
  } else if (type === "purgeUnusedData") {
    onPurgeUnusedData();
  } else if (type === "logGUI") {
    onLogGUI();
  } else if (type === "exportGUI") {
    onExportGUI();
  } else if (type === "exportGUISpine") {
    onExportGUISpines();
  } else if (type === "exportGUISpineAttachments") {
    onExportGUISpineAttachments();
  } else if (type === "copyGUI") {
    onCopyGUI();
  } else if (type === "copyGUIScheme") {
    onCopyGUIScheme();
  } else if (type === "updateGUI" && data?.gui) {
    onUpdateGUI(data.gui);
  } else if (type === "updateGUINode" && data?.guiNode) {
    onUpdateGUINode(data.guiNode);
  } else if (type === "removeGUI") {
    onRemoveGUI();
  } else if (type === "removeGUIOverrides") {
    onRemoveGUIOverrides();
  } else if (type === "fixGUI") {
    onFixGUI();
  } else if (type === "fixGUIText") {
    onFixGUIText();
  } else if (type === "matchGUINodeToGUIParent") {
    onMatchGUINodeToGUIParent();
  } else if (type === "matchGUINodeToGUIChild") {
    onMatchGUINodeToGUIChild();
  } else if (type === "resizeGUIToScreen") {
    onResizeGUIToScreen();
  } else if (type === "forceGUIChildrenOnScreen") {
    onForceGUIChildrenOnScreen();
  } else if (type === "exportGameCollections") {
    onExportGameCollections();
  } else if (type === "copyGameCollection") {
    onCopyGameCollection();
  } else if (type === "updateGameObject" && data?.gameObject) {
    onUpdateGameObject(data.gameObject);
  } else if (type === "removeGameObjects") {
    onRemoveGameObjects();
  } else if (type === "fixGameObjects") {
    onFixGameObjects();
  } else if (type === "exportAtlases") {
    onExportAtlases();
  } else if (type === "exportGUIAtlases") {
    onExportGUIAtlases();
  } else if (type === "exportGameCollectionAtlases") {
    onExportGameCollectionAtlases();
  } else if (type === "exportSprites" && data?.option && typeof data.option === "number") {
    onExportSprites(data.option);
  } else if (type === "createAtlas") {
    onCreateAtlas();
  } else if (type === "restoreAtlases") {
    onRestoreAtlases();
  } else if (type === "addSprites") {
    onAddSprites();
  } else if (type === "updateAtlas" && data?.atlas) {
    onUpdateAtlas(data.atlas);
  } else if (type === "removeAtlases") {
    onRemoveAtlases();
  } else if (type === "fixAtlases") {
    onFixAtlases();
  } else if (type === "sortAtlasesSize") {
    onSortAtlasesBySize();
  } else if (type === "sortAtlasesAlphabet") {
    onSortAtlasesAlphabetically();
  } else if (type === "fitAtlases") {
    onFitAtlases();
  } else if (type === "copyAtlases")  {
    onCopyAtlases();
  } else if (type === "updateSection" && data?.section) {
    onUpdateSection(data.section);
  } else if (type === "removeSections") {
    onRemoveSections();
  } else if (type === "exportBundle") {
    onExportBundle();
  } else if (type === "exportBareBundle") {
    onExportBareBundle();
  } else if (type === "exportGUIPSD") {
    onExportGUIPSD();
  } else if (type === "restoreSlice9") {
    onRestoreSlice9();
  } else if (type === "requestImage") {
    onRequestImage();
  } else if (type === "collapseUI") {
    onCollapseUI();
  } else if (type === "expandUI") {
    onExpandUI();
  }
}

function onUpdateProject(data: Partial<ProjectData>): void {
  updateProject(data);
  figma.notify("Project updated");
}

function onPurgeUnusedData(): void {
  purgeUnusedData();
  figma.notify("Unused data purged");
}

function onLogGUI(): void {
  const gui = pickGUIFromSelectionData(SELECTION);
  logGUI(gui);
}

function onExportGUI(): void {
  const gui = pickGUIFromSelectionData(SELECTION);
  exportGUI(gui)
    .then(onGUIExported)
    .catch(processError);
}

function onGUIExported(gui: SerializedGUIData[]): void {
  const bundle = { gui };
  const data = { bundle, project: PROJECT_CONFIG };
  tryPostMessageToUI("guiExported", data);
  updateSelection();
  figma.notify("GUI exported");
}

function onCopyGUI(): void {
  const layer = pickFirstGUINodeFromSelectionData(SELECTION);
  copyGUI(layer)
    .then(onGUICopied)
    .catch(processError);
}

function onGUICopied(gui: SerializedGUIData): void {
  const bundle = { gui: [ gui ] };
  const data = { bundle };
  tryPostMessageToUI("guiCopied", data);
  updateSelection();
  figma.notify("GUI node copied");
}

function onCopyGUIScheme(): void {
  const layer = pickFirstGUINodeFromSelectionData(SELECTION);
  copyGUIScheme(layer)
    .then(onGUISchemeCopied)
    .catch(processError);
}

function onGUISchemeCopied(guiData: SerializedGUIData): void {
  const { data: scheme } = guiData;
  const data = { scheme };
  tryPostMessageToUI("guiSchemeCopied", data);
  figma.notify("GUI node scheme copied");
}

function onUpdateGUI(data: PluginGUINodeData[]): void {
  const gui = pickGUIFromSelectionData(SELECTION);
  updateGUI(gui, data);
}

function onUpdateGUINode(data: PluginGUINodeData): void {
  const layer = pickFirstGUINodeFromSelectionData(SELECTION);
  updateGUINode(layer, data);
}

function onRemoveGUI(): void {
  const gui = pickGUIFromSelectionData(SELECTION);
  removeGUI(gui);
  updateSelection();
  figma.notify("GUI nodes reset");
}

function onRemoveGUIOverrides(): void {
  const gui = pickGUIFromSelectionData(SELECTION);
  resetGUIOverrides(gui);
  delay(500)
    .then(onGUIOverridesRemoved);
}

function onGUIOverridesRemoved(): void {
  updateSelection();
  figma.notify("GUI node data pulled");
}

function onFixGUI(): void {
  const gui = pickGUIFromSelectionData(SELECTION);
  fixGUI(gui);
  delay(200)
    .then(onGUFixed);
}

function onGUFixed(): void {
  updateSelection();
  figma.notify("GUI nodes fixed");
}

function onFixGUIText(): void {
  const layer = pickFirstGUINodeFromSelectionData(SELECTION);
  tryFixGUIText(layer);
  updateSelection();
  figma.notify("Text node fixed");
}

function onMatchGUINodeToGUIParent(): void {
  const layer = pickFirstGUINodeFromSelectionData(SELECTION);
  tryMatchGUINodeToGUIParent(layer);
  figma.notify("GUI node is matched to the parent");
}

function onMatchGUINodeToGUIChild(): void {
  const layer = pickFirstGUINodeFromSelectionData(SELECTION);
  tryMatchGUINodeToGUIChild(layer);
  figma.notify("Parent is matched to GUI node");
}

function onResizeGUIToScreen(): void {
  const gui = pickGUIFromSelectionData(SELECTION);
  resizeGUIToScreen(gui);
  figma.notify("Nodes resized to screen size");
}

function onForceGUIChildrenOnScreen(): void {
  const layer = pickFirstGUINodeFromSelectionData(SELECTION);
  tryForceGUIChildrenOnScreen(layer);
  figma.notify("Children will be exported on screen");
}

function onExportGameCollections(): void {
  const gameObjects = pickGameObjectsFromSelectionData(SELECTION);
  exportGameCollections(gameObjects)
    .then(onGameCollectionsExported)
    .catch(processError);
}

function onGameCollectionsExported(gameObjects: SerializedGameCollectionData[]): void {
  const bundle = { gameObjects };
  const data = { bundle, project: PROJECT_CONFIG };
  tryPostMessageToUI("gameCollectionsExported", data);
  updateSelection();
  figma.notify("Game collections exported");
}

function onCopyGameCollection(): void {
  const layer = pickFirstGameObjectFromSelectionData(SELECTION);
  copyGameCollection(layer)
    .then(onGameCollectionCopied)
    .catch(processError);
}

function onGameCollectionCopied(gameObject: SerializedGameCollectionData): void {
  const bundle = { gameObjects: [ gameObject ] };
  const data = { bundle };
  tryPostMessageToUI("gameCollectionCopied", data);
  updateSelection();
  figma.notify("Game collection copied");
}

function onUpdateGameObject(data: PluginGameObjectData): void {
  const layer = pickFirstGameObjectFromSelectionData(SELECTION);
  updateGameObject(layer, data);
}

function onRemoveGameObjects(): void {
  const gameObjects = pickGameObjectsFromSelectionData(SELECTION);
  removeGameObjects(gameObjects);
  updateSelection();
  figma.notify("Game objects reset");
}

function onFixGameObjects(): void {
  const gameObjects = pickGameObjectsFromSelectionData(SELECTION);
  fixGameObjects(gameObjects);
  delay(200)
    .then(onGameObjectsFixed);
}

function onGameObjectsFixed(): void {
  updateSelection();
  figma.notify("Game objects fixed");
}

function onExportAtlases(): void {
  const atlases = reduceAtlasesFromSelectionData(SELECTION);
  exportAtlases(atlases)
    .then(onAtlasesExported)
    .catch(processError);
  }

  
function onExportGUIAtlases(): void {
  const gui = pickGUIFromSelectionData(SELECTION);
  exportGUIAtlases(gui, false, DEFAULT_PACK_OPTIONS)
    .then(onAtlasesExported)
    .catch(processError);
}

function onExportGameCollectionAtlases(): void {
  const gameObjects = pickGameObjectsFromSelectionData(SELECTION);
  exportGameCollectionAtlases(gameObjects)
    .then(onAtlasesExported)
    .catch(processError);
}

function onAtlasesExported(atlases: SerializedAtlasData[]): void {
  const bundle = { atlases };
  const data = { bundle, project: PROJECT_CONFIG };
  tryPostMessageToUI("atlasesExported", data);
  figma.notify("Atlases exported");
}

function onExportSprites(scale: number = 1): void {
  const atlases = reduceAtlasesFromSelectionData(SELECTION);
  exportAtlases(atlases, scale)
    .then(onSpritesExported)
    .catch(processError);
}

function onSpritesExported(atlases: SerializedAtlasData[]): void {
  const bundle = { atlases };
  const data = { bundle, project: PROJECT_CONFIG };
  tryPostMessageToUI("spritesExported", data);
  figma.notify("Sprites exported");
}

function onCreateAtlas(): void {
  const layers = pickLayersFromSelectionData(SELECTION);
  const atlas = createAtlas(layers);
  selectFigmaLayer(atlas);
  figma.notify("Atlas created");
}

function onRestoreAtlases(): void {
  const layers = pickLayersFromSelectionData(SELECTION);
  tryRestoreAtlases(layers);
  updateSelection();
  figma.notify("Atlases restored");
}

function onAddSprites(): void {
  const atlas = pickFirstAtlasFromSelectionData(SELECTION);
  const layers = pickLayersFromSelectionData(SELECTION);
  addSprites(atlas, layers);
  selectFigmaLayer(atlas);
  figma.notify("Sprites added to atlas");
}

function onUpdateAtlas(data: PluginAtlasData): void {
  const atlas = pickFirstAtlasFromSelectionData(SELECTION);
  updateAtlas(atlas, data);
}

function onRemoveAtlases(): void {
  const atlases = pickAtlasesFromSelectionData(SELECTION);
  removeAtlases(atlases);
  updateSelection();
  figma.notify("Atlases destroyed");
}

function onFixAtlases(): void {
  const atlases = pickAtlasesFromSelectionData(SELECTION);
  fixAtlases(atlases);
  figma.notify("Atlases fixed");
}

function onSortAtlasesBySize(): void {
  const atlases = pickAtlasesFromSelectionData(SELECTION);
  sortAtlasesBySize(atlases);
  figma.notify("Atlases sorted");
}

function onSortAtlasesAlphabetically(): void {
  const atlases = pickAtlasesFromSelectionData(SELECTION);
  sortAtlasesAlphabetically(atlases);
  figma.notify("Atlases sorted");
}

function onFitAtlases(): void {
  const atlases = pickAtlasesFromSelectionData(SELECTION);
  fitAtlases(atlases);
  figma.notify("Atlases fitted");
}

function onCopyAtlases(): void {
  const atlases = pickAtlasesFromSelectionData(SELECTION);
  const copies = copyAtlases(atlases);
  selectFigmaLayers(copies, true);
  updateSelection();
  figma.notify("Atlases copied");
}

function onExportGUISpines(): void {
  const gui = pickGUIFromSelectionData(SELECTION);
  exportGUISpines(gui)
    .then(onGUISpinesExported)
    .catch(processError);
}

function onExportGUISpineAttachments(): void {
  const gui = pickGUIFromSelectionData(SELECTION);
  exportGUISpineAttachments(gui)
    .then(onGUISpinesExported)
    .catch(processError);
}

function onGUISpinesExported(bundle: BundleData): void {
  const data = { bundle, project: PROJECT_CONFIG };
  tryPostMessageToUI("spinesExported", data);
  figma.notify("GUI exported as Spine");
}

function onUpdateSection(data: PluginSectionData): void {
  const { sections: [ section ] } = SELECTION;
  updateSection(section, data);
}

function onRemoveSections(): void {
  const { sections } = SELECTION;
  removeSections(sections);
  updateSelection();
  figma.notify("Sections reset");
}

function onExportBundle(): void {
  const { gui, gameObjects } = SELECTION;
  const bundle = { gui, gameObjects };
  exportBundle(bundle)
    .then(onBundleExported)
    .catch(processError);
}

function onExportBareBundle(): void {
  const { gui, gameObjects } = SELECTION;
  const bundle = { gui, gameObjects };
  exportBareBundle(bundle)
    .then(onBundleExported)
    .catch(processError);
}

function onBundleExported(bundle: BundleData): void {
  const data = { bundle, project: PROJECT_CONFIG };
  tryPostMessageToUI("bundleExported", data);
  updateSelection();
  figma.notify("Bundle exported");
}

function onExportGUIPSD(): void {
  const gui = pickGUIFromSelectionData(SELECTION);
  exportGUIPSD(gui)
    .then(onGUIPSDExported)
    .catch(processError);
}

function onGUIPSDExported(psd: SerializedPSDData[]): void {
  const bundle = { psd };
  const data = { bundle, project: PROJECT_CONFIG };
  tryPostMessageToUI("psdExported", data);
  figma.notify("GUI exported as PSD");
}

function onRequestImage(): void {
  const layer = pickFirstGUINodeFromSelectionData(SELECTION);
  tryExtractImage(layer)
    .then(onImageExtracted)
    .catch(processError);
}

function onImageExtracted(image?: WithNull<Uint8Array>): void {
  if (image) {
    const data = { image };
    tryPostMessageToUI("imageExtracted", data);
    figma.notify("Image extracted");
  }
}

function onRestoreSlice9(): void {
  const layer = pickFirstGUINodeFromSelectionData(SELECTION);
  tryRestoreSlice9Placeholder(layer, "defoldGUINode")
    .then(onSlice9Restored)
    .catch(processError);
}

function onSlice9Restored(): void {
  updateSelection();
  figma.notify("Slice 9 restored");
}

function onCollapseUI(): void {
  const { uiSize: { collapsed } } = config;
  resizeUI(collapsed);
}

function onExpandUI(): void {
  const { uiSize: { expanded } } = config;
  resizeUI(expanded);
}

initializePlugin();
