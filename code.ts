import { reduceSelection, areMultipleDefoldComponentsSelected, areMultipleFigmaLayersSelected, isDefoldComponentSelected, isFigmaLayerSelected } from './utilities/figma';
import { createDefoldComponent, createMultipleDefoldComponents, removeDefoldComponent, removeMultipleDefoldComponents } from './utilities/defold';

let selection: SelectionData = { defoldComponents: [], figmaLayers: [] };

function showPluginSection(section: PluginUISection) {
  figma.showUI(__uiFiles__[section]);
}

function switchPluginSection(selection: SelectionData) {
  if (isDefoldComponentSelected(selection)) {
    showPluginSection('defoldComponent');
  } else if (areMultipleDefoldComponentsSelected(selection)) {
    showPluginSection('multipleDefoldComponents');
  } else if (isFigmaLayerSelected(selection)) {
    showPluginSection('figmaLayer');
  } else if (areMultipleFigmaLayersSelected(selection)) {
    showPluginSection('multipleFigmaLayers');
  } else {
    showPluginSection('start');
  }
}

function updatePluginUI() {
  switchPluginSection(selection);
}

function processPluginUIMessage(message: PluginUIMessage) {
  if (message.action === 'createDefoldComponent') {
    if (isFigmaLayerSelected(selection)) {
      const [ layer ] = selection.figmaLayers;
      createDefoldComponent(layer);
    } else if (areMultipleFigmaLayersSelected(selection)) {
      createMultipleDefoldComponents(selection.figmaLayers);
    }
  } else if (message.action === 'removeDefoldComponent') {
    if (isDefoldComponentSelected(selection)) {
      const [ defoldComponent ] = selection.defoldComponents;
      removeDefoldComponent(defoldComponent);
    } else if (areMultipleDefoldComponentsSelected(selection)) {
      removeMultipleDefoldComponents(selection.defoldComponents);
    }
  }
}

function onSelectionChange() {
  selection = reduceSelection();
  updatePluginUI();
}

function onPluginUIMessage(message: PluginUIMessage) {
  processPluginUIMessage(message);
  updatePluginUI();
}

function initializePlugin() {
  figma.on('selectionchange', onSelectionChange);
  figma.ui.on('message', onPluginUIMessage);
  updatePluginUI();
}

initializePlugin();