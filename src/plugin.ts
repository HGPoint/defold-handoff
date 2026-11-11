/**
 * The entry point for the Figma plugin application. It manages business logic, including atlases, GUI nodes, game objects, and the overall project.
 * @packageDocumentation
 */

import config from "config/config.json";
import { captureNode, describeDocument, findNodes, inspectNodes, runCode, selectNodes } from "handoff/agent";
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
import { isCurrentUIModeAgent } from "utilities/ui";

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
  const { uiSize: { agent, expanded } } = config;
  const size = isCurrentUIModeAgent() ? agent : expanded;
  const html = __html__.replace("{{defoldHandoffUIMode}}", `"${figma.command}"`);
  figma.showUI(html, { ...size, themeColors: true });
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
 */
function onUIMessage(message: PluginMessage): void {
  processUIMessage(message)
    .then((data) => onUIMessageProcessed(message, data))
    .catch((error: Error) => onUIMessageFailed(message, error));
}

/**
 * Handler function for a processed message from the UI application.
 * @param message - The processed message.
 * @param data - The data to respond with.
 */
function onUIMessageProcessed({ requestId }: PluginMessage, data: PluginMessagePayload | void): void {
  tryPostMessageToUI("responded", data ?? {}, requestId);
}

/**
 * Handler function for a failed message from the UI application.
 * @param message - The failed message.
 * @param error - The error that occurred.
 */
function onUIMessageFailed({ requestId }: PluginMessage, error: Error): void {
  const data = { error: processError(error) };
  tryPostMessageToUI("failed", data, requestId);
}

/**
 * Attempts to post a message to the the UI application.
 * @param type - The message type.
 * @param data - The message data.
 * @param requestId - The id of the request the message responds to.
 */
function tryPostMessageToUI(type: PluginMessageAction, data: PluginMessagePayload, requestId?: string): void {
  if (isUIAvailable()) {
    figma.ui.postMessage({ type, data, requestId });
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
 * @returns The data to respond with.
 * @async
 */
async function processUIMessage(message: PluginMessage): Promise<PluginMessagePayload | void> {
  const { type, data } = message;
  if (type === "updateProject" && data?.project) {
    return onUpdateProject(data.project);
  } else if (type === "purgeUnusedData") {
    return onPurgeUnusedData();
  } else if (type === "logGUI") {
    return onLogGUI();
  } else if (type === "exportGUI") {
    return onExportGUI();
  } else if (type === "exportGUISpine") {
    return onExportGUISpines();
  } else if (type === "exportGUISpineAttachments") {
    return onExportGUISpineAttachments();
  } else if (type === "copyGUI") {
    return onCopyGUI();
  } else if (type === "copyGUIScheme") {
    return onCopyGUIScheme();
  } else if (type === "updateGUI" && data?.gui) {
    return onUpdateGUI(data.gui);
  } else if (type === "updateGUINode" && data?.guiNode) {
    return onUpdateGUINode(data.guiNode);
  } else if (type === "removeGUI") {
    return onRemoveGUI();
  } else if (type === "removeGUIOverrides") {
    return onRemoveGUIOverrides();
  } else if (type === "fixGUI") {
    return onFixGUI();
  } else if (type === "fixGUIText") {
    return onFixGUIText();
  } else if (type === "matchGUINodeToGUIParent") {
    return onMatchGUINodeToGUIParent();
  } else if (type === "matchGUINodeToGUIChild") {
    return onMatchGUINodeToGUIChild();
  } else if (type === "resizeGUIToScreen") {
    return onResizeGUIToScreen();
  } else if (type === "forceGUIChildrenOnScreen") {
    return onForceGUIChildrenOnScreen();
  } else if (type === "exportGameCollections") {
    return onExportGameCollections();
  } else if (type === "copyGameCollection") {
    return onCopyGameCollection();
  } else if (type === "updateGameObject" && data?.gameObject) {
    return onUpdateGameObject(data.gameObject);
  } else if (type === "removeGameObjects") {
    return onRemoveGameObjects();
  } else if (type === "fixGameObjects") {
    return onFixGameObjects();
  } else if (type === "exportAtlases") {
    return onExportAtlases();
  } else if (type === "exportGUIAtlases") {
    return onExportGUIAtlases();
  } else if (type === "exportGameCollectionAtlases") {
    return onExportGameCollectionAtlases();
  } else if (type === "exportSprites" && data?.option && typeof data.option === "number") {
    return onExportSprites(data.option);
  } else if (type === "createAtlas") {
    return onCreateAtlas();
  } else if (type === "restoreAtlases") {
    return onRestoreAtlases();
  } else if (type === "addSprites") {
    return onAddSprites();
  } else if (type === "updateAtlas" && data?.atlas) {
    return onUpdateAtlas(data.atlas);
  } else if (type === "removeAtlases") {
    return onRemoveAtlases();
  } else if (type === "fixAtlases") {
    return onFixAtlases();
  } else if (type === "sortAtlasesSize") {
    return onSortAtlasesBySize();
  } else if (type === "sortAtlasesAlphabet") {
    return onSortAtlasesAlphabetically();
  } else if (type === "fitAtlases") {
    return onFitAtlases();
  } else if (type === "copyAtlases")  {
    return onCopyAtlases();
  } else if (type === "updateSection" && data?.section) {
    return onUpdateSection(data.section);
  } else if (type === "removeSections") {
    return onRemoveSections();
  } else if (type === "exportBundle") {
    return onExportBundle();
  } else if (type === "exportBareBundle") {
    return onExportBareBundle();
  } else if (type === "exportGUIPSD") {
    return onExportGUIPSD();
  } else if (type === "restoreSlice9") {
    return onRestoreSlice9();
  } else if (type === "requestImage") {
    return onRequestImage();
  } else if (type === "collapseUI") {
    return onCollapseUI();
  } else if (type === "expandUI") {
    return onExpandUI();
  } else if (type === "agentDocument") {
    return onAgentDocument();
  } else if (type === "agentFind" && data?.agentFind) {
    return onAgentFind(data.agentFind);
  } else if (type === "agentInspect" && data?.agentInspect) {
    return onAgentInspect(data.agentInspect);
  } else if (type === "agentSelect" && data?.agentSelect) {
    return onAgentSelect(data.agentSelect);
  } else if (type === "agentCapture" && data?.agentCapture) {
    return onAgentCapture(data.agentCapture);
  } else if (type === "agentRun" && data?.agentRun) {
    return onAgentRun(data.agentRun);
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

function onExportGUI(): Promise<void> {
  const gui = pickGUIFromSelectionData(SELECTION);
  return exportGUI(gui)
    .then(onGUIExported);
}

function onGUIExported(gui: SerializedGUIData[]): void {
  const bundle = { gui };
  const data = { bundle, project: PROJECT_CONFIG };
  tryPostMessageToUI("guiExported", data);
  updateSelection();
  figma.notify("GUI exported");
}

function onCopyGUI(): Promise<void> {
  const layer = pickFirstGUINodeFromSelectionData(SELECTION);
  return copyGUI(layer)
    .then(onGUICopied);
}

function onGUICopied(gui: SerializedGUIData): void {
  const bundle = { gui: [ gui ] };
  const data = { bundle };
  tryPostMessageToUI("guiCopied", data);
  updateSelection();
  figma.notify("GUI node copied");
}

function onCopyGUIScheme(): Promise<void> {
  const layer = pickFirstGUINodeFromSelectionData(SELECTION);
  return copyGUIScheme(layer)
    .then(onGUISchemeCopied);
}

function onGUISchemeCopied(guiData: SerializedGUIData): void {
  const { data: scheme } = guiData;
  const data = { scheme };
  tryPostMessageToUI("guiSchemeCopied", data);
  figma.notify("GUI node scheme copied");
}

async function onUpdateGUI(data: PluginGUINodeData[]): Promise<void> {
  const gui = pickGUIFromSelectionData(SELECTION);
  await updateGUI(gui, data);
}

async function onUpdateGUINode(data: PluginGUINodeData): Promise<void> {
  const layer = pickFirstGUINodeFromSelectionData(SELECTION);
  await updateGUINode(layer, data);
}

function onRemoveGUI(): void {
  const gui = pickGUIFromSelectionData(SELECTION);
  removeGUI(gui);
  updateSelection();
  figma.notify("GUI nodes reset");
}

function onRemoveGUIOverrides(): Promise<void> {
  const gui = pickGUIFromSelectionData(SELECTION);
  resetGUIOverrides(gui);
  return delay(500)
    .then(onGUIOverridesRemoved);
}

function onGUIOverridesRemoved(): void {
  updateSelection();
  figma.notify("GUI node data pulled");
}

function onFixGUI(): Promise<void> {
  const gui = pickGUIFromSelectionData(SELECTION);
  fixGUI(gui);
  return delay(200)
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

function onExportGameCollections(): Promise<void> {
  const gameObjects = pickGameObjectsFromSelectionData(SELECTION);
  return exportGameCollections(gameObjects)
    .then(onGameCollectionsExported);
}

function onGameCollectionsExported(gameObjects: SerializedGameCollectionData[]): void {
  const bundle = { gameObjects };
  const data = { bundle, project: PROJECT_CONFIG };
  tryPostMessageToUI("gameCollectionsExported", data);
  updateSelection();
  figma.notify("Game collections exported");
}

function onCopyGameCollection(): Promise<void> {
  const layer = pickFirstGameObjectFromSelectionData(SELECTION);
  return copyGameCollection(layer)
    .then(onGameCollectionCopied);
}

function onGameCollectionCopied(gameObject: SerializedGameCollectionData): void {
  const bundle = { gameObjects: [ gameObject ] };
  const data = { bundle };
  tryPostMessageToUI("gameCollectionCopied", data);
  updateSelection();
  figma.notify("Game collection copied");
}

async function onUpdateGameObject(data: PluginGameObjectData): Promise<void> {
  const layer = pickFirstGameObjectFromSelectionData(SELECTION);
  await updateGameObject(layer, data);
}

function onRemoveGameObjects(): void {
  const gameObjects = pickGameObjectsFromSelectionData(SELECTION);
  removeGameObjects(gameObjects);
  updateSelection();
  figma.notify("Game objects reset");
}

function onFixGameObjects(): Promise<void> {
  const gameObjects = pickGameObjectsFromSelectionData(SELECTION);
  fixGameObjects(gameObjects);
  return delay(200)
    .then(onGameObjectsFixed);
}

function onGameObjectsFixed(): void {
  updateSelection();
  figma.notify("Game objects fixed");
}

function onExportAtlases(): Promise<void> {
  const atlases = reduceAtlasesFromSelectionData(SELECTION);
  return exportAtlases(atlases)
    .then(onAtlasesExported);
}

function onExportGUIAtlases(): Promise<void> {
  const gui = pickGUIFromSelectionData(SELECTION);
  return exportGUIAtlases(gui, false, DEFAULT_PACK_OPTIONS)
    .then(onAtlasesExported);
}

function onExportGameCollectionAtlases(): Promise<void> {
  const gameObjects = pickGameObjectsFromSelectionData(SELECTION);
  return exportGameCollectionAtlases(gameObjects)
    .then(onAtlasesExported);
}

function onAtlasesExported(atlases: SerializedAtlasData[]): void {
  const bundle = { atlases };
  const data = { bundle, project: PROJECT_CONFIG };
  tryPostMessageToUI("atlasesExported", data);
  figma.notify("Atlases exported");
}

function onExportSprites(scale: number = 1): Promise<void> {
  const atlases = reduceAtlasesFromSelectionData(SELECTION);
  return exportAtlases(atlases, scale)
    .then(onSpritesExported);
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

async function onUpdateAtlas(data: PluginAtlasData): Promise<void> {
  const atlas = pickFirstAtlasFromSelectionData(SELECTION);
  await updateAtlas(atlas, data);
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

function onExportGUISpines(): Promise<void> {
  const gui = pickGUIFromSelectionData(SELECTION);
  return exportGUISpines(gui)
    .then(onGUISpinesExported);
}

function onExportGUISpineAttachments(): Promise<void> {
  const gui = pickGUIFromSelectionData(SELECTION);
  return exportGUISpineAttachments(gui)
    .then(onGUISpinesExported);
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

function onExportBundle(): Promise<void> {
  const { gui, gameObjects } = SELECTION;
  const bundle = { gui, gameObjects };
  return exportBundle(bundle)
    .then(onBundleExported);
}

function onExportBareBundle(): Promise<void> {
  const { gui, gameObjects } = SELECTION;
  const bundle = { gui, gameObjects };
  return exportBareBundle(bundle)
    .then(onBundleExported);
}

function onBundleExported(bundle: BundleData): void {
  const data = { bundle, project: PROJECT_CONFIG };
  tryPostMessageToUI("bundleExported", data);
  updateSelection();
  figma.notify("Bundle exported");
}

function onExportGUIPSD(): Promise<void> {
  const gui = pickGUIFromSelectionData(SELECTION);
  return exportGUIPSD(gui)
    .then(onGUIPSDExported);
}

function onGUIPSDExported(psd: SerializedPSDData[]): void {
  const bundle = { psd };
  const data = { bundle, project: PROJECT_CONFIG };
  tryPostMessageToUI("psdExported", data);
  figma.notify("GUI exported as PSD");
}

function onRequestImage(): Promise<void> {
  const layer = pickFirstGUINodeFromSelectionData(SELECTION);
  return tryExtractImage(layer)
    .then(onImageExtracted);
}

function onImageExtracted(image?: WithNull<Uint8Array>): void {
  if (image) {
    const data = { image };
    tryPostMessageToUI("imageExtracted", data);
    figma.notify("Image extracted");
  }
}

function onRestoreSlice9(): Promise<void> {
  const layer = pickFirstGUINodeFromSelectionData(SELECTION);
  return tryRestoreSlice9Placeholder(layer, "defoldGUINode")
    .then(onSlice9Restored);
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

function onAgentDocument(): PluginMessagePayload {
  const document = describeDocument();
  return { document };
}

function onAgentFind(request: AgentFindRequest): Promise<PluginMessagePayload> {
  return findNodes(request)
    .then(onAgentNodesResolved);
}

function onAgentInspect(request: AgentInspectRequest): Promise<PluginMessagePayload> {
  return inspectNodes(request)
    .then(onAgentNodesResolved);
}

function onAgentNodesResolved(nodes: AgentNodeData[]): PluginMessagePayload {
  return { nodes };
}

function onAgentSelect(request: AgentSelectRequest): Promise<PluginMessagePayload> {
  return selectNodes(request)
    .then(onAgentNodesSelected);
}

function onAgentNodesSelected(nodes: AgentNodeData[]): PluginMessagePayload {
  updateSelection();
  return { nodes };
}

function onAgentCapture(request: AgentCaptureRequest): Promise<PluginMessagePayload> {
  return captureNode(request)
    .then(onAgentNodeCaptured);
}

function onAgentNodeCaptured(image: Uint8Array): PluginMessagePayload {
  return { image };
}

function onAgentRun(request: AgentRunRequest): Promise<PluginMessagePayload> {
  return runCode(request)
    .then(onAgentCodeRun);
}

function onAgentCodeRun(result: unknown): PluginMessagePayload {
  return { result };
}

initializePlugin();
