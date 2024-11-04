/**
 * Entry point for the plugin. Facilitates the exchange of data between the Figma document and the plugin UI.
 * @packageDocumentation
 */

import { getPluginData, selectNode, hasVariantPropertyChanged, hasNamePropertyChanged, isFigmaComponentInstance, isPropertyChange, setPluginData } from "utilities/figma";
import { reducePluginSelection, convertPluginUISelection, reduceAtlases, reduceGUINodes, reduceBundle } from "utilities/selection";  
import { isSlice9Layer, isSlice9PlaceholderLayer, tryRefreshSlice9Sprite, tryUpdateOriginalLayerName  } from "utilities/slice9";
import { isTemplateGUINode } from "utilities/gui";
import { decipherError } from "utilities/error";
import { initializeProject, projectConfig, updateProject } from "handoff/project";
import { updateGUINode, updateGUINodes, tryRestoreSlice9Node, copyGUINode, exportGUINodes, exportGUINodeAtlases, removeGUINodes, fixGUITextNode, fixGUINodes, matchParentToGUINode, matchGUINodeToParent, resizeScreenGUINodes, copyGUINodeScheme, pullFromMainComponents, forceChildrenOnScreen } from "handoff/gui";
import { createAtlas, addSprites, fixAtlases, sortAtlases, fitAtlases, exportAtlases, destroyAtlases, tryRestoreAtlases, tryExtractImage } from "handoff/atlas";
import { updateSection, removeSections } from "handoff/section";
import { copyGameObject, updateGameObject, exportGameObjects, removeGameObjects, fixGameObjects } from "handoff/gameObject";
import { exportBundle } from "handoff/bundle";
import { delay } from "utilities/delay";

let selection: SelectionData = { gui: [], atlases: [], layers: [], sections: [], gameObjects: [] };
let lastExtractedImage: string;

/**
 * Posts a message to the plugin UI.
 * @param type - The message type.
 * @param data - The message data.
 */
function postMessageToPluginUI(type: PluginMessageAction, data: PluginMessagePayload) {
  if (isPluginUIShown()) {
    figma.ui.postMessage({ type, data });
  }
}

/**
 * Checks if the plugin UI is shown.
 * @returns A boolean indicating if the plugin UI is shown.
 */
function isPluginUIShown() {
  return figma.ui;
}

/**
 * Updates the selection data and sends it to the plugin UI.
 * @async
 */
async function updateSelection() {
  lastExtractedImage = "";
  selection = reducePluginSelection();
  const selectionUI = await convertPluginUISelection(selection);
  postMessageToPluginUI("selectionChanged", { selection: selectionUI });
}

function onSelectionChange() {
  updateSelection();
}

function onCopyGUINodes() {
  const { gui: [ layer ] } = selection;
  const nodeExport = { layer, asTemplate: isTemplateGUINode(layer) };
  copyGUINode(nodeExport)
    .then(onGUINodesCopied)
    .catch(processError);
}

function onGUINodesCopied(gui: SerializedGUIData) {
  const bundle = { gui: [ gui ] };
  postMessageToPluginUI("guiNodesCopied", { bundle })
  updateSelection();
  figma.notify("GUI node copied");
}

function onExportGUINodes() {
  const nodes = reduceGUINodes(selection);
  exportGUINodes(nodes)
    .then(onGUINodesExported)
    .catch(processError);
}

function onGUINodesExported(gui: SerializedGUIData[]) {
  const bundle = { gui };
  postMessageToPluginUI("guiNodesExported", { bundle, project: projectConfig })
  updateSelection();
  figma.notify("GUI nodes exported");
}

function onExportGUINodeAtlases() {
  const nodes = reduceGUINodes(selection);
  exportGUINodeAtlases(nodes)
    .then(onGUINodeAtlasesExported)
    .catch(processError);
}

function onGUINodeAtlasesExported(atlases: SerializedAtlasData[]) {
  const bundle = { atlases };
  postMessageToPluginUI("guiNodeAtlasesExported", { bundle, project: projectConfig })
  figma.notify("Atlases exported");
}

function onUpdateGUINode(data: PluginGUINodeData) {
  const { gui: [ layer ] } = selection;
  updateGUINode(layer, data);
}

function onUpdateGUINodes(data: PluginGUINodeData[]) {
  const { gui: layers } = selection;
  updateGUINodes(layers, data);
}

async function onCopyGUINodeScheme() {
  const { gui: [ layer ] } = selection;
  const nodeExport = { layer, asTemplate: isTemplateGUINode(layer) };
  copyGUINodeScheme(nodeExport)
    .then(onGUINodeSchemeCopied)
    .catch(processError);
}

function onGUINodeSchemeCopied(scheme: string) {
  postMessageToPluginUI("guiNodeSchemeCopied", { scheme })
  figma.notify("GUI node scheme copied");
}

function onResetGUINodes() {
  removeGUINodes(selection.gui);
  updateSelection();
  figma.notify("GUI nodes reset");
}

function onFixGUINodes() {
  fixGUINodes(selection.gui);
  delay(200)
    .then(onGUINodesFixed);
}

function onGUINodesFixed() {
  updateSelection();
  figma.notify("GUI nodes fixed");
}

function onMatchParentToGUINode() {
  const { gui: [layer] } = selection;
  matchParentToGUINode(layer);
  figma.notify("Parent is matched to GUI node");
}

function onMatchGUINodeToParent() {
  const { gui: [layer] } = selection;
  matchGUINodeToParent(layer);
  figma.notify("GUI node is matched to the parent");
}

function onForceChildrenOnScreen() {
  const { gui: [layer] } = selection;
  forceChildrenOnScreen(layer);
  figma.notify("Children will be exported on screen");
}

function onResizeScreenGUINodes() {
  resizeScreenGUINodes(selection.gui);
  figma.notify("Nodes resized to screen size");
}

function onCreateAtlas() {
  const atlas = createAtlas(selection.layers);
  selectNode([atlas]);
  figma.notify("Atlas created");
}

function onRestoreAtlases() {
  tryRestoreAtlases(selection.layers);
  updateSelection();
  figma.notify("Atlases restored");
}

function onAddSprites() {
  const [ atlas ] = selection.atlases
  addSprites(atlas, selection.layers);
  selectNode([atlas]);
  figma.notify("Sprites added to atlas");
}

function onFixAtlases() {
  const atlases = reduceAtlases(selection);
  fixAtlases(atlases);
  figma.notify("Atlases fixed");
}

function onSortAtlases() {
  const atlases = reduceAtlases(selection);
  sortAtlases(atlases);
  figma.notify("Atlases sorted");
}

function onFitAtlases() {
  const atlases = reduceAtlases(selection);
  fitAtlases(atlases);
  figma.notify("Atlases fitted");
}

function onExportAtlases() {
  const atlases = reduceAtlases(selection);
  exportAtlases(atlases)
    .then(onAtlasesExported)
    .catch(processError);
}

function onAtlasesExported(atlases: SerializedAtlasData[]) {
  const bundle = { atlases };
  postMessageToPluginUI("atlasesExported", { bundle, project: projectConfig });
  figma.notify("Atlases exported");
}

function onDestroyAtlases() {
  const atlases = reduceAtlases(selection);
  destroyAtlases(atlases);
  updateSelection();
  figma.notify("Atlases destroyed");
}

function onExportSprites(scale: number = 1) {
  const atlases = reduceAtlases(selection);
  exportAtlases(atlases, scale)
    .then(onSpritesExported)
    .catch(processError);
}

function onSpritesExported(atlases: SerializedAtlasData[]) {
  const bundle = { atlases };
  postMessageToPluginUI("spritesExported", { bundle, project: projectConfig });
  figma.notify("Sprites exported");
}

function onExportBundle() {
  const bundleExport = reduceBundle(selection);
  exportBundle(bundleExport)
    .then(onBundleExported)
    .catch(processError);
}

function onBundleExported(bundle: BundleData) {
  postMessageToPluginUI("bundleExported", { bundle, project: projectConfig });
  updateSelection();
  figma.notify("Bundle exported");
}

function onShowGUINodeData() {
  selection.gui.forEach(layer => {
    console.log(getPluginData(layer, "defoldGUINode"))
  })
}

function onFixTextNode() {
  const { gui: [ layer ] } = selection;
  fixGUITextNode(layer);
  updateSelection();
  figma.notify("Text node fixed");
}

function onPullFromMainComponet() {
  const { gui } = selection;
  pullFromMainComponents(gui)
  delay(500)
    .then(onGUINodeDataPulled);
}

function onGUINodeDataPulled() {
  updateSelection();
  figma.notify("GUI node data pulled");
}

function onRestoreSlice9Node() {
  const { gui: [ layer ] } = selection;
  tryRestoreSlice9Node(layer)
    .then(onSlice9NodeRestored)
    .catch(processError);
}

function onSlice9NodeRestored() {
  updateSelection();
  figma.notify("Slice 9 fixed");
}

function onUpdateSection(data: PluginSectionData) {
  const { sections: [ section ] } = selection;
  updateSection(section, data);
}

function onResetSections() {
  removeSections(selection.sections);
  updateSelection();
  figma.notify("Sections reset");
}

function onUpdateProject(data: Partial<ProjectData>) {
  updateProject(data);
  figma.notify("Project updated");
}

async function onRequestImage() {
  const { gui: [layer] } = selection;
  if (layer && layer.id !== lastExtractedImage) {
    lastExtractedImage = layer.id;
    const image = await tryExtractImage(layer);
    if (image) {
      postMessageToPluginUI("requestedImage", { image });
    }
  }
}

function onExportGameObjects() {
  exportGameObjects(selection.gameObjects)
    .then(onGameObjectsExported)
    .catch(processError);
}

function onGameObjectsExported(gameObjects: SerializedGameCollectionData[]) {
  const bundle = { gameObjects };
  postMessageToPluginUI("gameObjectsExported", { bundle, project: projectConfig })
  updateSelection();
  figma.notify("Game objects exported");
}

function onFixGameObjects() {
  fixGameObjects(selection.gameObjects);
  delay(200)
    .then(onGameObjectsFixed);
}

function onGameObjectsFixed() {
  updateSelection();
  figma.notify("Game objects fixed");
}

function onResetGameObjects() {
  removeGameObjects(selection.gameObjects);
  updateSelection();
  figma.notify("Game objects reset");
}

function onCopyGameObjects() {
  const { gameObjects: [ layer ] } = selection;
  copyGameObject(layer)
    .then(onGameObjectsCopied)
    .catch(processError);
}

function onGameObjectsCopied(gameObject: SerializedGameCollectionData) {
  const bundle = { gameObjects: [ gameObject ] };
  postMessageToPluginUI("gameObjectsCopied", { bundle })
  updateSelection();
  figma.notify("Game object copied");
}

function onUpdateGameObject(data: PluginGameObjectData) {
  const { gameObjects: [ layer ] } = selection;
  updateGameObject(layer, data);
}

/**
 * Processes a message from the plugin UI.
 * @param message - The message from the plugin UI.
 */
function processPluginUIMessage(message: PluginMessage) {
  const { type, data } = message;
  if (type === "copyGUINodes") {
    onCopyGUINodes();
  } else if (type === "exportGUINodes") {
    onExportGUINodes();
  } else if (type === "exportGUINodeAtlases") {
    onExportGUINodeAtlases();
  } else if (type === "resetGUINodes") {
    onResetGUINodes();
  } else if (type === "fixGUINodes") {
    onFixGUINodes();
  } else if (type === "matchParentToGUINode") {
    onMatchParentToGUINode();
  } else if (type === "matchGUINodeToParent") {
    onMatchGUINodeToParent();
  } else if (type === "forceChildrenOnScreen") {
    onForceChildrenOnScreen();
  } else if (type === "resizeScreenGUINodes") {
    onResizeScreenGUINodes();
  } else if (type === "updateGUINode" && data?.guiNode) {
    onUpdateGUINode(data.guiNode);
  } else if (type === "updateGUINodes" && data?.gui) {
    onUpdateGUINodes(data.gui);
  } else if (type === "copyGUINodeScheme") {
    onCopyGUINodeScheme();
  } else if (type === "showGUINodeData") {
    onShowGUINodeData();
  } else if (type === "createAtlas") {
    onCreateAtlas();
  } else if (type === "restoreAtlases") {
    onRestoreAtlases();
  } else if (type === "addSprites") {
    onAddSprites()
  } else if (type === "fixAtlases") {
    onFixAtlases();
  } else if (type === "sortAtlases") {
    onSortAtlases();
  } else if (type === "fitAtlases") {
    onFitAtlases();
  } else if (type === "exportAtlases") {
    onExportAtlases();
  } else if (type === "destroyAtlases") {
    onDestroyAtlases();
  } else if (type === "exportSprites" && data?.option && typeof data.option === "number") {
    onExportSprites(data.option);
  } else if (type === "exportBundle") {
    onExportBundle();
  } else if (type === "fixTextNode") {
    onFixTextNode();
  } else if (type === "pullFromMainComponent") {
    onPullFromMainComponet();
  } else if (type === "restoreSlice9Node") {
    onRestoreSlice9Node();
  } else if (type === "updateSection" && data?.section) {
    onUpdateSection(data.section);
  } else if (type === "resetSections") {
    onResetSections();
  } else if (type === "updateProject" && data?.project) {
    onUpdateProject(data.project);
  } else if (type === "collapseUI") {
    collapseUI();
  } else if (type === "expandUI") {
    expandUI();
  } else if (type === "requestImage") {
    onRequestImage();
  } else if (type === "fixGameObjects") {
    onFixGameObjects();
  } else if (type === "resetGameObjects") {
    onResetGameObjects();
  } else if (type === "exportGameObjects") {
    onExportGameObjects();
  } else if (type === "copyGameObjects") {
    onCopyGameObjects();
  } else if (type === "updateGameObject" && data?.gameObject) {
    onUpdateGameObject(data.gameObject);
  }
}

function processError(error: Error) {
  const text = decipherError(error);
  figma.notify(text);
  console.error(error);
  console.warn(text);
}

function onPluginUIMessage(message: PluginMessage) {
  try {
    processPluginUIMessage(message);
  } catch (error) {
    processError(error as Error);
  }
}

/**
 * Handler for when a name property changes on a node.
 * @param node - The node with the name property change.
 */
function onNamePropertyChange(node: SceneNode) {
  if (isSlice9PlaceholderLayer(node)) {
    tryUpdateOriginalLayerName(node);
  }
  updateSelection();
}

/**
 * Handler for when a variant property changes on a node.
 * @param node - The node with the variant property change.
 */
function onVariantPropertyChange(node: SceneNode) {
  if (isSlice9Layer(node) && isFigmaComponentInstance(node)) {
    tryRefreshSlice9Sprite(node);
  }
}

/**
 * Processes a single document change.
 * @param change - The document change.
 */
function processDocumentChange(change: DocumentChange) {
  if (isPropertyChange(change)) {
    const { node } = change;
    if (!node?.removed) {
      if (hasNamePropertyChanged(change)) {
        onNamePropertyChange(node);
      }
      if (hasVariantPropertyChanged(change)) {
        onVariantPropertyChange(node);
      }
    }
  }
}

/**
 * Tries to restore GUI node data from overrides (in case component instance node was reset).
 * @param node - The Figma component instance node to restore data for.
 */
function tryRestoreDataFromOverrides(node: InstanceNode) {
  const { root: document } = figma;
  const key: PluginDataOverrideKey = `defoldGUINodeOverride-${node.id}`;
  const guiNodeDataOverrides = getPluginData(document, key);
  if (guiNodeDataOverrides) {
    const guiNodeData = { defoldGUINode: guiNodeDataOverrides }
    setPluginData(node, guiNodeData);
  }
}

/**
 * Reduces unique component instances from document changes.
 * @param instances - The reduced component instances.
 * @param change - The document change.
 * @returns The reduced component instances.
 */
function reduceComponentInstances(instances: InstanceNode[], change: DocumentChange) {
  if (isPropertyChange(change)) {
    const { node } = change;
    if (!node.removed && isFigmaComponentInstance(node) && !instances.includes(node)) {
      instances.push(node);
    }
  }
  return instances;
}

/**
 * Processes changes to the document.
 * @param event - The document change event.
 */
function processDocumentChanges(event: DocumentChangeEvent) {
  event.documentChanges.forEach(processDocumentChange);
  const componentInstances = event.documentChanges.reduce(reduceComponentInstances, [] as InstanceNode[]);
  componentInstances.forEach(tryRestoreDataFromOverrides);
}

function onDocumentChange(event: DocumentChangeEvent) {
  processDocumentChanges(event);
}

/**
 * Collapses the plugin UI.
 */
function collapseUI() {
  figma.ui.resize(400, 47);
}

/**
 * Expands the plugin UI.
 */
function expandUI() {
  figma.ui.resize(400, 600);
}

/**
 * Initializes the plugin UI.
 */
function initializeUI() {
  const html = __html__.replace("{{defoldHandoffUIMode}}", `"${figma.command}"`);
  figma.showUI(html, { width: 400, height: 600 });
}

/**
 * Initializes the plugin message listeners.
 */
function initializeMessages() {
  figma.on("selectionchange", onSelectionChange);
  figma.on("documentchange", onDocumentChange);
  figma.ui.on("message", onPluginUIMessage);
}

/**
 * Initializes the plugin.
 */
async function initializePlugin() {
  await figma.loadAllPagesAsync();
  initializeProject();
  initializeMessages();
  initializeUI();
  updateSelection();
}

initializePlugin();
