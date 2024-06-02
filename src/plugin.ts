/**
 * Entry point for the plugin. Facilitates the exchange of data between the Figma document and the plugin UI.
 * @packageDocumentation
 */

import { getPluginData, hasVariantPropertyChanged, isFigmaComponentInstance } from "utilities/figma";
import { isGUINodeSelected, reducePluginSelection, convertPluginUISelection, reduceAtlases, reduceGUINodes } from "utilities/selection";  
import { isSlice9Layer, tryRefreshSlice9Sprite  } from "utilities/slice9";
import { isTemplateGUINode } from "utilities/gui";
import { initializeProject, projectConfig, updateProject } from "handoff/project";
import { updateGUINode, tryRestoreSlice9Node, copyGUINode, exportGUINodes, removeGUINodes, fixTextNode, fixGUINodes, matchGUINodes, resizeScreenNodes, copyGUINodeScheme } from "handoff/gui";
import { createAtlas, addSprites, fixAtlases, sortAtlases, fitAtlases, exportAtlases, destroyAtlases, tryRestoreAtlases, tryExtractImage } from "handoff/atlas";
import { updateSection, removeSections } from "handoff/section";
import { exportBundle } from "handoff/bundle";

let selection: SelectionData = { gui: [], atlases: [], layers: [], sections: [] };
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
 */
function updateSelection() {
  lastExtractedImage = "";
  selection = reducePluginSelection();
  const selectionUI = convertPluginUISelection(selection);
  postMessageToPluginUI("selectionChanged", { selection: selectionUI });
}

/**
 * Selects the specified nodes in the Figma document.
 * @param nodes - The nodes to select.
 */
function selectNode(nodes: SceneNode[]) {
  figma.currentPage.selection = nodes;
  figma.viewport.scrollAndZoomIntoView(nodes);
}

function onSelectionChange() {
  updateSelection();
}

function onCopyGUINode() {
  const { gui: [layer] } = selection;
  const nodeExport = { layer, asTemplate: isTemplateGUINode(layer) };
  copyGUINode(nodeExport)
    .then(onGUINodeCopied);
}

function onGUINodeCopied(gui: SerializedGUIData) {
  const bundle = { gui: [gui] };
  postMessageToPluginUI("guiNodesCopied", { bundle })
  figma.notify("GUI node copied");
}

function onExportGUINodes() {
  const nodes = reduceGUINodes(selection);
  exportGUINodes(nodes)
    .then(onGUINodesExported);
}

function onGUINodesExported(gui: SerializedGUIData[]) {
  const bundle = { gui };
  postMessageToPluginUI("guiNodesExported", { bundle, project: projectConfig })
  figma.notify("GUI nodes exported");
}

function onUpdateGUINode(data: PluginGUINodeData) {
  const { gui: [ layer ] } = selection;
  updateGUINode(layer, data);
}

async function onCopyGUINodeScheme() {
  const { gui: [ layer ] } = selection;
  const nodeExport = { layer, asTemplate: isTemplateGUINode(layer) };
  copyGUINodeScheme(nodeExport)
    .then(onGUINodeSchemeCopied);
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
  updateSelection();
  figma.notify("GUI nodes fixed");
}

function onMatchGUINodes() {
  const { gui: [layer] } = selection;
  matchGUINodes(layer);
  figma.notify("GUI nodes matched");
}

function onResizeScreenNodes() {
  resizeScreenNodes(selection.gui);
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
    .then(onAtlasesExported);
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

function onExportBundle() {
  const nodes = reduceGUINodes(selection);
  exportBundle(nodes)
    .then(onBundleExported);
}

function onBundleExported(bundle: BundleData) {
  postMessageToPluginUI("bundleExported", { bundle, project: projectConfig });
  figma.notify("Bundle exported");
}

function onShowGUINodeData() {
  selection.gui.forEach(layer => { console.log(getPluginData(layer, "defoldGUINode")) })
}

function onFixTextNode() {
  const { gui: [ layer ] } = selection;
  fixTextNode(layer);
  figma.notify("Text node fixed");
}

function onRestoreSlice9Node() {
  const { gui: [ layer ] } = selection;
  tryRestoreSlice9Node(layer);
  updateSelection();
  figma.notify("Slice 9 restored");
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

/**
 * Processes a message from the plugin UI.
 * @param message - The message from the plugin UI.
 */
function processPluginUIMessage(message: PluginMessage) {
  const { type, data } = message;
  if (type === "copyGUINodes") {
    onCopyGUINode();
  } else if (type === "exportGUINodes") {
    onExportGUINodes();
  } else if (type === "resetGUINodes") {
    onResetGUINodes();
  } else if (type === "fixGUINodes") {
    onFixGUINodes();
  } else if (type === "matchGUINodes") {
    onMatchGUINodes();
  } else if (type === "resizeScreenNodes"){
    onResizeScreenNodes();
  } else if (type === "updateGUINode" && data?.guiNode) {
    onUpdateGUINode(data.guiNode);
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
  } else if (type === "exportBundle") {
    onExportBundle();
  } else if (type === "fixTextNode") {
    onFixTextNode();
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
  }
}

function onPluginUIMessage(message: PluginMessage) {
  processPluginUIMessage(message);
}

function onSlice9VariantPropertyChange(layer: InstanceNode) {
  tryRefreshSlice9Sprite(layer);
}

/**
 * Processes a document change event.
 * @param event - The document change event.
 */
function processDocumentChange(event: DocumentChangeEvent) {
  if (isGUINodeSelected(selection)) {
    const { gui: [layer] } = selection;
    if (isSlice9Layer(layer) && isFigmaComponentInstance(layer) && hasVariantPropertyChanged(event)) {
      onSlice9VariantPropertyChange(layer);
    }
  }
}

function onDocumentChange(event: DocumentChangeEvent) {
  processDocumentChange(event);
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
