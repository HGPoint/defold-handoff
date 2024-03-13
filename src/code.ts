import { reduceSelection, isFigmaLayerSelected, areMultipleFigmaLayersSelected, isDefoldComponentSelected, areMultipleDefoldComponentsSelected, isDefoldAtlasSelected, areMultipleDefoldAtlasesSelected } from './utilities/figma';
import { createDefoldComponents, exportDefoldComponents, removeDefoldComponents } from './defold/component';
import { createDefoldAtlas, exportDefoldAtlases, removeDefoldAtlases } from './defold/atlas';

let currentSection: PluginUISection = 'start';
let selection: SelectionData = { defoldComponents: [], defoldAtlases: [], figmaLayers: [] };

function shouldShowPluginSection(section: PluginUISection) {
  return currentSection !== section;
}

function showPluginSection(section: PluginUISection) {
  if (shouldShowPluginSection(section)) {
    currentSection = section;
    figma.showUI(__uiFiles__[section]);
  }
}

function switchPluginSection(selection: SelectionData) {
  if (isDefoldComponentSelected(selection)) {
    showPluginSection('defoldComponent');
  } else if (areMultipleDefoldComponentsSelected(selection)) {
    showPluginSection('defoldComponents');
  } else if (isDefoldAtlasSelected(selection)) {
    showPluginSection('defoldAtlas');
  } else if (areMultipleDefoldAtlasesSelected(selection)) {
    showPluginSection('defoldAtlases');
  } else if (isFigmaLayerSelected(selection)) {
    showPluginSection('figmaLayer');
  } else if (areMultipleFigmaLayersSelected(selection)) {
    showPluginSection('figmaLayers');
  } else {
    showPluginSection('start');
  }
}

function updatePluginUI() {
  switchPluginSection(selection);
}

function updateSelection() {
  selection = reduceSelection();
}

function selectNode(nodes: SceneNode[]) {
  figma.currentPage.selection = nodes;
  figma.viewport.scrollAndZoomIntoView(nodes);
}

function onCreateDefoldComponents() {
  const components = createDefoldComponents(selection.figmaLayers);
  selectNode(components);
}

function onExportDefoldComponents() {
  exportDefoldComponents(selection.defoldComponents);
}

function onRemoveDefoldComponents() {
  removeDefoldComponents(selection.defoldComponents);
}

function onCreateDefoldAtlas() {
  const atlas = createDefoldAtlas(selection.figmaLayers);
  selectNode([atlas]);
}

function onDefoldAtlasesExported(atlases: AtlasData[]) {
  figma.ui.postMessage({ type: 'defoldAtlasesExported', atlases });
}

function onExportDefoldAtlases() {
  exportDefoldAtlases(selection.defoldAtlases).then(onDefoldAtlasesExported);
}

function onRemoveDefoldAtlases() {
  removeDefoldAtlases(selection.defoldAtlases);
}

function processPluginUIMessage(message: PluginUIMessage) {
  if (message.type === 'createDefoldComponents') {
    onCreateDefoldComponents();
  } else if (message.type === 'exportDefoldComponents') {
    onExportDefoldComponents();
  } else if (message.type === 'removeDefoldComponents') {
    onRemoveDefoldComponents();
  } else if (message.type === 'createDefoldAtlas') {
    onCreateDefoldAtlas();
  } else if (message.type === 'exportDefoldAtlases') {
    onExportDefoldAtlases();
  } else if (message.type === 'removeDefoldAtlases') {
    onRemoveDefoldAtlases();
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
  updateSelection()
  updatePluginUI();
}

initializePlugin();