import { reduceSelection, convertSelection } from "utilities/figma";
import { updateGUINode, copyGUINodes, exportGUINodes, resetGUINodes } from "defold/gui";
import { createAtlas, exportAtlases, destroyAtlases } from "defold/atlas";
import { exportBundle } from "defold/bundle";

let selection: SelectionData = { gui: [], atlases: [], layers: [] };

function postMessageToPluginUI(type: PluginMessageAction, data: PluginMessagePayload) {
  if (isPluginUIShown()) {
    figma.ui.postMessage({ type, data });
  }
}

function isPluginUIShown() {
  return figma.ui;
}

function updateSelection() {
  selection = reduceSelection();
  const selectionUI = convertSelection(selection);
  postMessageToPluginUI("selectionChanged", { selection: selectionUI });
}

function selectNode(nodes: SceneNode[]) {
  figma.currentPage.selection = nodes;
  figma.viewport.scrollAndZoomIntoView(nodes);
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

function onResetGUINodes() {
  resetGUINodes(selection.gui);
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
  } else if (type === "createAtlas") {
    onCreateAtlas();
  } else if (type === "exportAtlases") {
    onExportAtlases();
  } else if (type === "destroyAtlases") {
    onDestroyAtlases();
  } else if (type === "exportBundle") {
    onExportBundle();
  }
}

function onSelectionChange() {
  updateSelection();
}

function onPluginUIMessage(message: PluginMessage) {
  processPluginUIMessage(message);
}

function initializePlugin() {
  figma.showUI(__html__, { width: 400, height: 600 });
  figma.on("selectionchange", onSelectionChange);
  figma.ui.on("message", onPluginUIMessage);
  updateSelection();
}

initializePlugin();