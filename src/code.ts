import { reduceSelection } from './utilities/figma';
import { createGUINodes, copyGUINodesToDefold, exportGUINodesToDefold, destroyGUINodes } from './defold/gui';
import { createAtlas, exportAtlases, destroyAtlases } from './defold/atlas';
import { exportBundle } from "./defold/bundle";

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
  postMessageToPluginUI('selectionChanged', selection);
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
  copyGUINodesToDefold(selection.gui)
    .then(onComponentsCopiedToDefold);
}

function onComponentsCopiedToDefold(gui: SerializedDefoldData[]) {
  postMessageToPluginUI('guiNodesCopied', { gui })
}

function onExportComponentsToDefold() {
  exportGUINodesToDefold(selection.gui)
    .then(onComponentsExportedToDefold);
}

function onComponentsExportedToDefold(gui: SerializedDefoldData[]) {
  postMessageToPluginUI('guiNodesExported', { gui })
}

function onExportBundleToDefold() {
  exportBundle(selection.gui)
    .then(onBundleExportedToDefold);
}

function onBundleExportedToDefold(bundle: BundleData) {
  postMessageToPluginUI('bundleExported', bundle);
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

function onDefoldAtlasesExported(atlases: AtlasData[]) {
  postMessageToPluginUI('atlasesExported', { atlases });
}

function onDestroyDefoldAtlases() {
  destroyAtlases(selection.atlases);
}

function processPluginUIMessage(message: PluginMessage) {
  const { type } = message;
  if (type === 'createGUINode') {
    onCreateAdvancedDefoldComponent();
  } else if (type === 'copyGUINodes') {
    onCopyComponentsToDefold();
  } else if (type === 'exportGUINodes') {
    onExportComponentsToDefold();
  } else if (type === 'exportBundle') {
    onExportBundleToDefold();
  } else if (type === 'destroyGUINodes') {
    onDestroyAdvancedDefoldComponents();
  } else if (type === 'createAtlas') {
    onCreateDefoldAtlas();
  } else if (type === 'exportAtlases') {
    onExportDefoldAtlases();
  } else if (type === 'destroyAtlases') {
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
  figma.on('selectionchange', onSelectionChange);
  figma.ui.on('message', onPluginUIMessage);
  updateSelection();
}

initializePlugin();