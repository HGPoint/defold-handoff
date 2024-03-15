import config from "./config/config.json";
import { reduceSelection, generatePluginUISelectionData, isFigmaLayerSelected, areMultipleFigmaLayersSelected, isDefoldComponentSelected, areMultipleDefoldComponentsSelected, isDefoldAtlasSelected, areMultipleDefoldAtlasesSelected } from './utilities/figma';
import { createAdvancedDefoldComponents, copyComponentsToDefold, exportComponentsToDefold, destroyAdvancedDefoldComponents } from './defold/component';
import { createDefoldAtlas, updateDefoldAtlas, exportDefoldAtlases, destroyDefoldAtlases } from './defold/atlas';

let currentSection: PluginUISection;
let currentSelection: SelectionData = { defoldComponents: [], defoldAtlases: [], figmaLayers: [] };

function postMessageToPluginUI(type: PluginUIAction, data: PluginUIMessagePayload) {
  if (isPluginUIShown()) {
    figma.ui.postMessage({ type, data });
  }
}

function isPluginUIShown() {
  return figma.ui && currentSection;
}

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
  switchPluginSection(currentSelection);
}

function updatePluginUISelection() {
  postMessageToPluginUI('figmaSelectionUpdated', { selection: generatePluginUISelectionData(currentSelection) });
}

function updateSelection() {
  currentSelection = reduceSelection();
}

function selectNode(nodes: SceneNode[]) {
  figma.currentPage.selection = nodes;
  figma.viewport.scrollAndZoomIntoView(nodes);
}

function onCreateAdvancedDefoldComponent() {
  const components = createAdvancedDefoldComponents(currentSelection.figmaLayers);
  selectNode(components);
}

function onCopyComponentsToDefold() {
  copyComponentsToDefold(currentSelection.defoldComponents)
    .then(onComponentsCopiedToDefold);
}

function onComponentsCopiedToDefold(component: string) {
  postMessageToPluginUI('componentsCopiedToDefold', { component })
}

function onExportComponentsToDefold() {
  exportComponentsToDefold(currentSelection.defoldComponents)
    .then(onComponentsExportedToDefold);
}

function onComponentsExportedToDefold(component: string) {
  postMessageToPluginUI('componentsExportedToDefold', { component })
}

function onDestroyAdvancedDefoldComponents() {
  destroyAdvancedDefoldComponents(currentSelection.defoldComponents);
}

function onCreateDefoldAtlas() {
  const atlas = createDefoldAtlas(currentSelection.figmaLayers);
  selectNode([atlas]);
}

function onUpdateDefoldAtlas(data: PluginUIMessagePayload) {
  const [ atlas ] = currentSelection.defoldAtlases;
  updateDefoldAtlas(atlas, data);
}

function onExportDefoldAtlases() {
  exportDefoldAtlases(currentSelection.defoldAtlases)
    .then(onDefoldAtlasesExported);
}

function onDefoldAtlasesExported(atlases: AtlasData[]) {
  postMessageToPluginUI('defoldAtlasesExported', { atlases, paths: config.paths });
}

function onDestroyDefoldAtlases() {
  destroyDefoldAtlases(currentSelection.defoldAtlases);
}

function processPluginUIMessage(message: PluginUIMessage) {
  const { type, data } = message;
  if (type === 'createAdvancedDefoldComponent') {
    onCreateAdvancedDefoldComponent();
  } else if (type === 'copyComponentsToDefold') {
    onCopyComponentsToDefold();
  } else if (type === 'exportComponentsToDefold') {
    onExportComponentsToDefold();
  } else if (type === 'destroyAdvancedDefoldComponents') {
    onDestroyAdvancedDefoldComponents();
  } else if (type === 'createDefoldAtlas') {
    onCreateDefoldAtlas();
  } else if (type === 'updateDefoldAtlas') {
    onUpdateDefoldAtlas(data);
  } else if (type === 'exportDefoldAtlases') {
    onExportDefoldAtlases();
  } else if (type === 'destroyDefoldAtlases') {
    onDestroyDefoldAtlases();
  }
}

function onSelectionChange() {
  updateSelection()
  updatePluginUI();
  updatePluginUISelection();
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
  updatePluginUISelection();
}

initializePlugin();