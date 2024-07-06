/**
 * Utility module for handling selection data.
 * @packageDocumentation
 */

import config from "config/config.json";
import { isSlice9PlaceholderLayer, isSlice9ServiceLayer, findOriginalLayer } from "utilities/slice9";
import { isAtlas, isFigmaFrame, isFigmaSection, isFigmaComponent, isFigmaComponentInstance, isFigmaBox, isFigmaText, isExportable, getPluginData, hasChildren } from "utilities/figma";
import { isTemplateGUINode } from "utilities/gui";
import { generateContextData } from "utilities/context";
import { projectConfig } from "handoff/project";

/**
 * Checks if a layer is selectable.
 * @param layer - The layer to check.
 * @returns True if the layer is selectable, false otherwise.
 */
function isSelectable(layer: SceneNode): boolean {
  return !isSlice9ServiceLayer(layer);
}

/**
 * Checks if a single GUI node is selected.
 * @param selection - The selection data.
 * @returns True if a single GUI node is selected, false otherwise.
 */
export function isGUINodeSelected(selection: SelectionData | SelectionUIData) {
  return selection?.gui?.length === 1;
}

/**
 * Checks if multiple GUI nodes are selected.
 * @param selection - The selection data.
 * @returns True if multiple GUI nodes are selected, false otherwise.
 */
export function areMultipleGUINodesSelected(selection: SelectionData | SelectionUIData) {
  return selection?.gui?.length > 1;
}

/**
 * Checks if a single atlas is selected.
 * @param selection - The selection data.
 * @returns True if a single atlas is selected, false otherwise.
 */
export function isAtlasSelected(selection: SelectionData | SelectionUIData) {
  return selection?.atlases?.length === 1;
}

/**
 * Checks if multiple atlases are selected.
 * @param selection - The selection data.
 * @returns True if multiple atlases are selected, false otherwise.
 */
export function areMultipleAtlasesSelected(selection: SelectionData | SelectionUIData) {
  return selection?.atlases?.length > 1;
}

/**
 * Checks if a single Figma layer is selected.
 * @param selection - The selection data.
 * @returns True if a single layer is selected, false otherwise.
 */
export function isLayerSelected(selection: SelectionData | SelectionUIData) {
  return selection?.layers?.length === 1;
}

/**
 * Checks if multiple Figma layers are selected.
 * @param selection - The selection data.
 * @returns True if multiple layers are selected, false otherwise.
 */
export function areMultipleLayersSelected(selection: SelectionData | SelectionUIData) {
  return selection?.layers?.length > 1;
}

/**
 * Checks if a single section is selected.
 * @param selection - The selection data.
 * @returns True if a single section is selected, false otherwise.
 */
export function isSectionSelected(selection: SelectionData | SelectionUIData) {
  return selection?.sections?.length === 1;
}

/**
 * Checks if multiple sections are selected.
 * @param selection - The selection data.
 * @returns True if multiple sections are selected, false otherwise.
 */
export function areMultipleSectionsSelected(selection: SelectionData | SelectionUIData) {
  return selection?.sections?.length > 1;
}

/**
 * Reducer function for plugin selection data. Sorts selected Figma layers into categories - GUI nodes, atlases, sections and layers.
 * @param selection - The selection data accumulator.
 * @param layer - The current layer being processed.
 * @returns The updated selection data.
 */
function pluginSelectionReducer(selection: SelectionData, layer: SceneNode): SelectionData {
  if (isSelectable(layer)) {
    if (isAtlas(layer)) {
      selection.atlases.push(layer);
    } else if (isFigmaSection(layer)) {
      selection.sections.push(layer);
    } else if (isFigmaFrame(layer) || isFigmaComponent(layer) || isFigmaComponentInstance(layer) || isFigmaText(layer)) {
      const originalLayer = isSlice9PlaceholderLayer(layer) ? findOriginalLayer(layer) : layer;
      if (originalLayer) {
        selection.gui.push(originalLayer);
      }
      if (!isFigmaText(layer)) {
        selection.layers.push(layer);
      }
    } else {
      selection.layers.push(layer);
    }
  }
  return selection;
}

/**
 * Reduces the current page selection to plugin selection data.
 * @returns The plugin selection data.
 */
export function reducePluginSelection(): SelectionData {
  const selection: SelectionData = { gui: [], atlases: [], layers: [], sections: [] };
  return figma.currentPage.selection.reduce(pluginSelectionReducer, selection);
}

/**
 * Reducer function that converts GUI node selection data to UI GUI node selection data.
 * @param data - The plugin selection data.
 * @param layer - The current layer being processed.
 */
function guiNodePluginUISelectionConverter(data: PluginGUINodeData[], layer: ExportableLayer): PluginGUINodeData[] {
  const pluginData = getPluginData(layer, "defoldGUINode");
  const { name: id } = layer;
  const type = isFigmaText(layer) ? "TYPE_TEXT" : (pluginData?.template ? "TYPE_TEMPLATE" : "TYPE_BOX");
  const template_name = pluginData?.template_name || id;
  const guiNodeData: PluginGUINodeData = {
    ...config.guiNodeDefaultValues,
    ...config.guiNodeDefaultSpecialValues,
    ...pluginData,
    template_name,
    id,
    type,
    figma_node_type: layer.type,
  };
  data.push(guiNodeData);
  return data;
}

/**
 * Reducer function that converts atlas selection data to UI atlas selection data.
 * @param data - The plugin selection data.
 * @param layer - The current layer being processed.
 */
function atlasPluginUISelectionConverter(data: PluginAtlasData[], layer: SceneNode): PluginAtlasData[] {
  const pluginData = getPluginData(layer, "defoldAtlas");
  if (pluginData) {
    data.push(pluginData);
  }
  return data;
}

/**
 * Reducer function that converts section selection data to UI section selection data.
 * @param data - The plugin selection data.
 * @param layer - The current layer being processed.
 */
function sectionPluginUISelectionConverter(data: PluginSectionData[], layer: SectionNode): PluginSectionData[] {
  const pluginData = getPluginData(layer, "defoldSection");
  const { name: id } = layer;
  const sectionData: PluginSectionData = {
    ...config.sectionDefaultValues,
    ...pluginData,
    id
  };
  data.push(sectionData);
  return data;
}

/**
 * Generates GUI node context data for current selection.
 * @param selection - The selection data.
 * @returns The context data.
 */
export function generateSelectionContextData(selection: SelectionData): PluginGUIContextData {
  if (selection.gui.length === 1) {
    const { gui: [ guiNode ] } = selection;
    return generateContextData(guiNode);
  }
  return {
    layers: JSON.parse(JSON.stringify(config.sectionDefaultValues.layers)),
    materials: JSON.parse(JSON.stringify(config.sectionDefaultValues.materials)),
    ignorePrefixes: config.sectionDefaultValues.ignorePrefixes
  }
}

/**
 * Checks if the selected GUI nodes can be matched by size.
 * @param selection - The selection data.
 * @returns True if the selected GUI nodes form potentially matchable pair, false otherwise.
 */
export function checkForMatchingPairs(selection: SelectionData): boolean {
  if (selection.gui.length === 1) {
    const [ guiNode ] = selection.gui;
    const { parent } = guiNode;
    return parent !== null && (isFigmaFrame(guiNode) || isFigmaComponentInstance(guiNode)) && isFigmaFrame(parent);
  }
  return false;
}

/**
 * Converts plugin selection data to UI selection data.
 * @param selection - The plugin selection data.
 * @returns The UI selection data.
 */
export function convertPluginUISelection(selection: SelectionData): SelectionUIData {
  return {
    gui: selection.gui.reduce(guiNodePluginUISelectionConverter, []),
    atlases: selection.atlases.reduce(atlasPluginUISelectionConverter, []),
    layers: selection.layers,
    sections: selection.sections.reduce(sectionPluginUISelectionConverter, []),
    project: projectConfig,
    context: generateSelectionContextData(selection),
    canTryMatch: checkForMatchingPairs(selection)
  }
}

/**
 * Reduces the selected section to a list of atlases it contains.
 * @param selection - The selection data.
 * @returns The list of atlases.
 */
export function reduceAtlases(selection: SelectionData): ComponentSetNode[] {
  const atlases = selection.sections.reduce((atlases, section) => {
    const sectionAtlases = section.children.filter((child): child is ComponentSetNode => isAtlas(child) && !atlases.includes(child));
    return [ ...atlases, ...sectionAtlases ]
  },  [...selection.atlases ] as ComponentSetNode[]);
  return atlases;
}

/**
 * Finds template nodes within a GUI node.
 * @param guiNode - The GUI node to search within.
 * @returns The list of template nodes found.
 */
export function findTemplateNodes(guiNode: ExportableLayer): GUINodeExport[] {
  const templateNodes: GUINodeExport[] = [];
  if (isFigmaBox(guiNode) && hasChildren(guiNode)) {
    const data = getPluginData(guiNode, "defoldGUINode");
    if (!data?.exclude) {
      const { children } = guiNode;
      for (const child of children) {
        if (child.visible && isExportable(child)) {
          if (isTemplateGUINode(child)) {
            templateNodes.push({ layer: child, asTemplate: true });
          } else {
            const childTemplateNodes = findTemplateNodes(child);
            templateNodes.push(...childTemplateNodes);
          }
        }
      }
    }
  }
  return templateNodes;
}

/**
 * Detects if a root GUI node is a template node
 * @param nodes - The list of GUI nodes to check.
 * @returns The list of root nodes.
 */
export function detectRootTemplates(nodes: ExportableLayer[]): GUINodeExport[] {
  return nodes.map(guiNode => ({ layer: guiNode, asTemplate: isTemplateGUINode(guiNode) }));
}

/**
 * Reduces the selection to a list of GUI nodes. If a GUI node is a template, it will be added to the list of GUI nodes.
 * @param selection - The selection data.
 * @returns The list of GUI nodes.
 */
export function reduceGUINodes(selection: SelectionData): GUINodeExport[] {
  const guiNodes = selection.gui.reduce((nodes, guiNode) => {
    const templateNodes = findTemplateNodes(guiNode);
    return [ ...nodes, ...templateNodes ]
  }, detectRootTemplates(selection.gui));
  return guiNodes;
}
