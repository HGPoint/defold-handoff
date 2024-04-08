import { getPluginData, hasVariantPropertyChanged } from "utilities/figma";
import { isGUINodeSelected, reducePluginSelection, convertPluginUISelection, reduceAtlases } from "utilities/selection";  
import { isSlice9Layer  } from "utilities/slice9";
import { initializeProject, updateProject } from "handoff/project";
import { updateGUINode, tryRefreshSlice9Sprite, tryRestoreSLice9Node, copyGUINodes, exportGUINodes, resetGUINodes, fixTextNode, fixGUINodes, copyGUINodeScheme } from "handoff/gui";
import { createAtlas, addSprites, fixAtlases, sortAtlases, exportAtlases, destroyAtlases, tryRestoreAtlases } from "handoff/atlas";
import { updateSection, resetSections } from "handoff/section";
import { exportBundle } from "handoff/bundle";

let selection: SelectionData = { gui: [], atlases: [], layers: [], sections: [] };

function postMessageToPluginUI(type: PluginMessageAction, data: PluginMessagePayload) {
  if (isPluginUIShown()) {
    figma.ui.postMessage({ type, data });
  }
}

function isPluginUIShown() {
  return figma.ui;
}

function updateSelection() {
  selection = reducePluginSelection();
  const selectionUI = convertPluginUISelection(selection);
  postMessageToPluginUI("selectionChanged", { selection: selectionUI });
}

function selectNode(nodes: SceneNode[]) {
  figma.currentPage.selection = nodes;
  figma.viewport.scrollAndZoomIntoView(nodes);
}

function onSelectionChange() {
  updateSelection();
}

function onCopyGUINodes() {
  copyGUINodes(selection.gui)
    .then(onGUINodesCopied);
}

function onGUINodesCopied(gui: SerializedGUIData[]) {
  const bundle = { gui };
  postMessageToPluginUI("guiNodesCopied", { bundle })
  figma.notify("GUI nodes copied");
}

function onExportGUINodes() {
  exportGUINodes(selection.gui)
    .then(onGUINodesExported);
}

function onGUINodesExported(gui: SerializedGUIData[]) {
  const bundle = { gui };
  postMessageToPluginUI("guiNodesExported", { bundle })
  figma.notify("GUI nodes exported");
}

function onUpdateGUINode(data: PluginGUINodeData) {
  const { gui: [ layer ] } = selection;
  updateGUINode(layer, data);
}

function onCopyGUINodeScheme() {
  const { gui: [ layer ] } = selection;
  copyGUINodeScheme(layer)
    .then(onGUINodeSchemeCopied);
  }
  
  function onGUINodeSchemeCopied(scheme: string) {
    postMessageToPluginUI("guiNodeSchemeCopied", { scheme })
    figma.notify("GUI node scheme copied");
  } 

function onResetGUINodes() {
  resetGUINodes(selection.gui);
  updateSelection();
  figma.notify("GUI nodes reset");
}

function onFixGUINodes() {
  fixGUINodes(selection.gui);
  figma.notify("GUI nodes fixed");
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

function onExportAtlases() {
  const atlases = reduceAtlases(selection);
  exportAtlases(atlases)
  .then(onAtlasesExported);
}

function onAtlasesExported(atlases: SerializedAtlasData[]) {
  const bundle = { atlases };
  postMessageToPluginUI("atlasesExported", { bundle });
  figma.notify("Atlases exported");
}

function onDestroyAtlases() {
  const atlases = reduceAtlases(selection);
  destroyAtlases(atlases);
  updateSelection();
  figma.notify("Atlases destroyed");
}

function onExportBundle() {
  exportBundle(selection.gui)
    .then(onBundleExported);
}

function onBundleExported(bundle: BundleData) {
  postMessageToPluginUI("bundleExported", { bundle });
  figma.notify("Bundle exported");
}

function onShowGUINodeData() {
  selection.gui.forEach(layer => { console.log(getPluginData(layer, "defoldGUINode")) })
}

function onFixTextNode() {
  const { gui: [ layer ] } = selection;
  fixTextNode(layer);
}

function onRestoreSlice9Node() {
  const { gui: [ layer ] } = selection;
  tryRestoreSLice9Node(layer);
  updateSelection();
}

function onUpdateSection(data: PluginSectionData) {
  const { sections: [ section ] } = selection;
  updateSection(section, data);
}

function onResetSections() {
  resetSections(selection.sections);
  updateSelection();
  figma.notify("Sections reset");
}

function onUpdateProject(data: Partial<ProjectData>) {
  updateProject(data);
  figma.notify("Project updated");
}

function processPluginUIMessage(message: PluginMessage) {
  const { type, data } = message;
  if (type === "copyGUINodes") {
    onCopyGUINodes();
  } else if (type === "exportGUINodes") {
    onExportGUINodes();
  } else if (type === "resetGUINodes") {
    onResetGUINodes();
  } else if (type === "fixGUINodes") {
    onFixGUINodes();
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
    onAddSprites();
  } else if (type === "fixAtlases") {
    onFixAtlases();
  } else if (type === "sortAtlases") {
    onSortAtlases();
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
  }
}

function onPluginUIMessage(message: PluginMessage) {
  processPluginUIMessage(message);
}

function onSlice9VariantPropertyChange(layer: InstanceNode) {
  tryRefreshSlice9Sprite(layer);
}

function processDocumentChange(event: DocumentChangeEvent) {
  if (isGUINodeSelected(selection)) {
    const { gui: [layer] } = selection;
    if (isSlice9Layer(layer) && hasVariantPropertyChanged(event)) {
      onSlice9VariantPropertyChange(layer);
    }
  }
}

function onDocumentChange(event: DocumentChangeEvent) {
  processDocumentChange(event);
}

function initializeUI() {
  figma.showUI(__html__, { width: 400, height: 600 });
}

function initializeMessages() {
  figma.on("selectionchange", onSelectionChange);
  figma.on("documentchange", onDocumentChange);
  figma.ui.on("message", onPluginUIMessage);
}

async function initializePlugin() {
  await figma.loadAllPagesAsync();
  initializeProject();
  initializeMessages();
  initializeUI();
  updateSelection();
}

initializePlugin();
