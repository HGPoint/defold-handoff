import { reduceSelection } from "utilities/figma";
import { createGUINodes, copyGUINodes, exportGUINodes, destroyGUINodes } from "defold/gui";
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
  postMessageToPluginUI("selectionChanged", { selection });
}

function selectNode(nodes: SceneNode[]) {
  figma.currentPage.selection = nodes;
  figma.viewport.scrollAndZoomIntoView(nodes);
}

function onCreateAdvancedDefoldComponent() {
  const guiNodes = createGUINodes(selection.layers);
  selectNode(guiNodes);
}

function onCopyComponentsToDefold() {
  copyGUINodes(selection.gui)
    .then(onComponentsCopiedToDefold);
}

function onComponentsCopiedToDefold(gui: SerializedGUIData[]) {
  const bundle = { gui };
  postMessageToPluginUI("guiNodesCopied", { bundle })
}

function onExportComponentsToDefold() {
  exportGUINodes(selection.gui)
    .then(onComponentsExportedToDefold);
}

function onComponentsExportedToDefold(gui: SerializedGUIData[]) {
  const bundle = { gui };
  postMessageToPluginUI("guiNodesExported", { bundle })
}

function onExportBundleToDefold() {
  exportBundle(selection.gui)
    .then(onBundleExportedToDefold);
}

function onBundleExportedToDefold(bundle: BundleData) {
  postMessageToPluginUI("bundleExported", { bundle });
}

function onDestroyAdvancedDefoldComponents() {
  destroyGUINodes(selection.gui);
}

function onCreateDefoldAtlas() {
  const atlas = createAtlas(selection.layers);
  selectNode([atlas]);
}

function onExportDefoldAtlases() {
  exportAtlases(selection.atlases)
    .then(onDefoldAtlasesExported);
}

function onDefoldAtlasesExported(atlases: SerializedAtlasData[]) {
  const bundle = { atlases };
  postMessageToPluginUI("atlasesExported", { bundle });
}

function onDestroyDefoldAtlases() {
  destroyAtlases(selection.atlases);
}

function processPluginUIMessage(message: PluginMessage) {
  const { type } = message;
  if (type === "createGUINode") {
    onCreateAdvancedDefoldComponent();
  } else if (type === "copyGUINodes") {
    onCopyComponentsToDefold();
  } else if (type === "exportGUINodes") {
    onExportComponentsToDefold();
  } else if (type === "exportBundle") {
    onExportBundleToDefold();
  } else if (type === "destroyGUINodes") {
    onDestroyAdvancedDefoldComponents();
  } else if (type === "createAtlas") {
    onCreateDefoldAtlas();
  } else if (type === "exportAtlases") {
    onExportDefoldAtlases();
  } else if (type === "destroyAtlases") {
    onDestroyDefoldAtlases();
  }
}

function onSelectionChange() {
  updateSelection()
}

function onPluginUIMessage(message: PluginMessage) {
  processPluginUIMessage(message);
}

function initializePlugin() {
  figma.showUI(__html__);
  figma.on("selectionchange", onSelectionChange);
  figma.ui.on("message", onPluginUIMessage);
  updateSelection();
}

initializePlugin();