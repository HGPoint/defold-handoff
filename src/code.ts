import config from "./config/config.json";
import { reduceSelection, isLayerSelected, areMultipleLayersSelected, isGUINodeSelected, areMultipleGUINodesSelected, isAtlasSelected, areAtlasesSelected } from './utilities/figma';
import { createGUINodes, copyGUINodesToDefold, exportGUINodesToDefold, destroyGUINodes } from './defold/gui';
import { createAtlas, exportAtlases, destroyAtlases } from './defold/atlas';
import { exportBundle } from "./defold/bundle";

let currentSection: PluginUISection;
let currentSelection: SelectionData = { guiNodes: [], atlases: [], layers: [] };

function postMessageToPluginUI(type: PluginUIAction, data: PluginUIMessagePayload) {
  if (isPluginUIShown()) {
    figma.ui.postMessage({ type, data });
  }
}

function isPluginUIShown() {
  return figma.ui && !!currentSection;
}

function shouldShowPluginSection(section: PluginUISection) {
  return currentSection !== section;
}

function showPluginSection(section: PluginUISection) {
  if (shouldShowPluginSection(section)) {
    currentSection = section;
    figma.showUI(__html__);
  }
}

function switchPluginSection(selection: SelectionData) {
  if (isGUINodeSelected(selection)) {
    showPluginSection('defoldComponent');
  } else if (areMultipleGUINodesSelected(selection)) {
    showPluginSection('defoldComponents');
  } else if (isAtlasSelected(selection)) {
    showPluginSection('defoldAtlas');
  } else if (areAtlasesSelected(selection)) {
    showPluginSection('defoldAtlases');
  } else if (isLayerSelected(selection)) {
    showPluginSection('figmaLayer');
  } else if (areMultipleLayersSelected(selection)) {
    showPluginSection('figmaLayers');
  } else {
    showPluginSection('start');
  }
}

function updatePluginUI() {
  switchPluginSection(currentSelection);
}

function updateSelection() {
  currentSelection = reduceSelection();
}

function selectNode(nodes: SceneNode[]) {
  figma.currentPage.selection = nodes;
  figma.viewport.scrollAndZoomIntoView(nodes);
}

function onCreateAdvancedDefoldComponent() {
  const guiNodes = createGUINodes(currentSelection.layers);
  selectNode(guiNodes);
}

function onCopyComponentsToDefold() {
  copyGUINodesToDefold(currentSelection.guiNodes)
    .then(onComponentsCopiedToDefold);
}

function onComponentsCopiedToDefold(components: SerializedDefoldData[]) {
  postMessageToPluginUI('guiNodesCopied', { gui: components })
}

function onExportComponentsToDefold() {
  exportGUINodesToDefold(currentSelection.guiNodes)
    .then(onComponentsExportedToDefold);
}

function onComponentsExportedToDefold(components: SerializedDefoldData[]) {
  postMessageToPluginUI('guiNodesExported', { gui: components })
}

function onExportBundleToDefold() {
  exportBundle(currentSelection.guiNodes)
    .then(onBundleExportedToDefold);
}

function onBundleExportedToDefold(bundle: BundleData) {
  postMessageToPluginUI('bundleExported', { ...bundle, paths: config.paths })
}

function onDestroyAdvancedDefoldComponents() {
  destroyGUINodes(currentSelection.guiNodes);
}

function onCreateDefoldAtlas() {
  const atlas = createAtlas(currentSelection.layers);
  selectNode([atlas]);
}

function onExportDefoldAtlases() {
  exportAtlases(currentSelection.atlases)
    .then(onDefoldAtlasesExported);
}

function onDefoldAtlasesExported(atlases: AtlasData[]) {
  postMessageToPluginUI('atlasesExported', { atlases, paths: config.paths });
}

function onDestroyDefoldAtlases() {
  destroyAtlases(currentSelection.atlases);
}

function processPluginUIMessage(message: PluginUIMessage) {
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
  updatePluginUI();
}

function onPluginUIMessage(message: PluginUIMessage) {
  processPluginUIMessage(message);
  updatePluginUI();
}

function initializePlugin() {
  figma.on('selectionchange', onSelectionChange);
  figma.ui.on('message', onPluginUIMessage);
  updateSelection();
  updatePluginUI();
}

initializePlugin();