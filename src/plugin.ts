import { getPluginData, hasVariantPropertyChanged } from "utilities/figma";
import { isGUINodeSelected, reducePluginSelection, convertPluginUISelection } from "utilities/selection";  
import { isSlice9Layer  } from "utilities/slice9";
import { updateGUINode, tryRefreshSlice9Sprite, tryRestoreSLice9Node, copyGUINodes, exportGUINodes, resetGUINodes, fixTextNode, copyGUINodeScheme } from "defold/gui";
import { createAtlas, exportAtlases, destroyAtlases } from "defold/atlas";
import { updateSection, resetSections } from "defold/section";
import { exportBundle } from "defold/bundle";

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
    console.log("2222222222222222222222222222222");
    postMessageToPluginUI("guiNodeSchemeCopied", { scheme })
    figma.notify("GUI node scheme copied");
  } 

function onResetGUINodes() {
  resetGUINodes(selection.gui);
  updateSelection();
  figma.notify("GUI nodes reset");
}

function onCreateAtlas() {
  const atlas = createAtlas(selection.layers);
  selectNode([atlas]);
  figma.notify("Atlas created");
}

function onExportAtlases() {
  exportAtlases(selection.atlases)
  .then(onAtlasesExported);
}

function onAtlasesExported(atlases: SerializedAtlasData[]) {
  const bundle = { atlases };
  postMessageToPluginUI("atlasesExported", { bundle });
  figma.notify("Atlases exported");
}

function onDestroyAtlases() {
  destroyAtlases(selection.atlases);
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

function processPluginUIMessage(message: PluginMessage) {
  const { type, data } = message;
  if (type === "copyGUINodes") {
    onCopyGUINodes();
  } else if (type === "exportGUINodes") {
    onExportGUINodes();
  } else if (type === "resetGUINodes") {
    onResetGUINodes();
  } else if (type === "updateGUINode" && data?.guiNode) {
    onUpdateGUINode(data.guiNode);
  } else if (type === "copyGUINodeScheme") {
    onCopyGUINodeScheme();
  } else if (type === "showGUINodeData") {
    onShowGUINodeData();
  } else if (type === "createAtlas") {
    onCreateAtlas();
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

async function initializePlugin() {
  await figma.loadAllPagesAsync();
  figma.showUI(__html__, { width: 400, height: 600 });
  figma.on("selectionchange", onSelectionChange);
  figma.on("documentchange", onDocumentChange);
  figma.ui.on("message", onPluginUIMessage);
  updateSelection();
}

initializePlugin();
