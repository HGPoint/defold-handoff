/**
 * Handles operations with selection in Figma.
 * @packageDocumentation
 */

import config from "config/config.json";
import { PROJECT_CONFIG } from "handoff/project";
import { copyArray, removeDoubles } from "utilities/array";
import { findSectionWithContextData, generateContextData } from "utilities/context";
import { findMainFigmaComponent, getPluginData, isFigmaComponentInstance, isFigmaFrame, isFigmaGroup, isFigmaSection, isFigmaSlice, isFigmaText, isLayerAtlas, isLayerGUINode, isLayerGameObject, isLayerNode } from "utilities/figma";
import { resolvesGUINodeType } from "utilities/gui";
import { inferGameObjectType, resolveGameObjectPosition, resolveLabelComponentPosition } from "utilities/inference";
import { findSlice9Layer, isSlice9PlaceholderLayer, isSlice9ServiceLayer } from "utilities/slice9";
import { isCurrentUIModeDeveloper, isCurrentUIModeGameDesigner } from "utilities/ui";

/**
 * Checks if a Figma layer is selectable.
 * @param layer - The Figma layer to check.
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
 * Checks if a single game object is selected.
 * @param selection - The selection data.
 * @returns True if a single game object is selected, false otherwise.
 */
export function isGameObjectSelected(selection: SelectionData | SelectionUIData) {
  return selection?.gameObjects?.length === 1;
}

/**
 * Checks if multiple game objects are selected.
 * @param selection - The selection data.
 * @returns True if multiple game objects are selected, false otherwise.
 */
export function areMultipleGameObjectsSelected(selection: SelectionData | SelectionUIData) {
  return selection?.gameObjects?.length > 1;
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
 * Reduces the current page selection to the selection data.
 * @returns The selection data.
 */
export function reduceSelectionDataFromSelection(): SelectionData {
  const selection: SelectionData = { gui: [], gameObjects: [], atlases: [], sections: [], layers: [] };
  const pluginSelection = figma.currentPage.selection.reduce(selectionDataReducer, selection);
  return pluginSelection;
}

/**
 * Reducer function that sorts selected Figma layers into categories - GUI nodes, game objects, atlases, sections and layers.
 * @param selection - The cumulative selection data.
 * @param layer - The layer to sort into one of the categories.
 * @returns The updated cumulative selection data.
 */
function selectionDataReducer(selection: SelectionData, layer: SceneNode): SelectionData {
  if (isSelectable(layer)) {
    if (isLayerAtlas(layer)) {
      selection.atlases.push(layer);
    } else if (isFigmaSection(layer)) {
      selection.sections.push(layer);
    } else if (isLayerNode(layer)) {
      const originalLayer = isSlice9PlaceholderLayer(layer) ? findSlice9Layer(layer) : layer;
      if (originalLayer) {
        if (isCurrentUIModeDeveloper()) {
          selection.gui.push(originalLayer);
        } else if (isCurrentUIModeGameDesigner()) {
          selection.gameObjects.push(originalLayer);
        } else {
          if (isLayerGUINode(originalLayer)) {
            selection.gui.push(originalLayer);
          }
          if (isLayerGameObject(originalLayer)) {
            selection.gameObjects.push(originalLayer);
          }
        }
      }
      if (!isFigmaText(layer)) {
        selection.layers.push(layer);
      }
    } else if (!isFigmaSlice(layer) && !isFigmaGroup(layer)) {
      selection.layers.push(layer);
    }
  }
  return selection;
}

/**
 * Converts plugin selection data to the UI selection data.
 * @param selection - The selection data to convert.
 * @returns The UI selection data.
 */
export async function convertSelectionDataToSelectionUIData(selection: SelectionData): Promise<SelectionUIData> {
  const gui = convertGUI(selection);
  const gameObjects = await convertGameObjects(selection);
  const atlases = convertAtlases(selection);
  const sections = convertSections(selection);
  const { layers } = selection;
  const project = PROJECT_CONFIG;
  const context = generateSelectionContextData(selection);
  const meta = await generateSelectionMetaData(selection);
  return {
    gui,
    gameObjects,
    atlases,
    sections,
    layers,
    project,
    context,
    meta
  }
}

/**
 * Converts GUI node selection data to the plugin GUI node data.
 * @param selection - The selection data.
 * @returns The converted array of the plugin GUI node data.
 */
function convertGUI(selection: SelectionData) {
  return selection.gui.reduce(guiNodeConverter, []);
}

/**
 * Reducer function that converts GUI node selection data to the plugin GUI node data.
 * @param data - The cumulative plugin GUI node data.
 * @param layer - The layer to convert to the plugin GUI node data.
 * @returns The updated cumulative plugin GUI node data.
 */
function guiNodeConverter(data: PluginGUINodeData[], layer: Exclude<ExportableLayer, SliceLayer>): PluginGUINodeData[] {
  const pluginData = getPluginData(layer, "defoldGUINode");
  const { name: id } = layer;
  const type = resolvesGUINodeType(layer, pluginData);
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
 * Converts game object selection data to the plugin game object data.
 * @param gameObjects - The selection data.
 * @returns The converted array of the plugin game object data.
 */
async function convertGameObjects(selection: SelectionData): Promise<PluginGameObjectData[]> {
  const { gameObjects } = selection;
  const gameObjectData: Promise<PluginGameObjectData>[] = [];
  for (const layer of gameObjects) {
    gameObjectData.push(gameObjectConverter(layer));
  }
  return Promise.all(gameObjectData);
}

/**
 * Converts game object selection data to the plugin game object data.
 * @param layer - The layer to convert to the plugin game object data.
 * @returns The converted plugin game object data.
 */
async function gameObjectConverter(layer: Exclude<ExportableLayer, SliceLayer>): Promise<PluginGameObjectData> {
  const pluginData = getPluginData(layer, "defoldGameObject");
  const { name: id } = layer;
  const type = await inferGameObjectType(layer);
  const position = isFigmaText(layer) ? resolveLabelComponentPosition(layer, pluginData) : resolveGameObjectPosition(layer, pluginData);
  const gameObjectData: PluginGameObjectData = {
    ...config.gameObjectDefaultValues,
    ...config.gameObjectDefaultSpecialValues,
    ...pluginData,
    id,
    type,
    position,
    figma_node_type: layer.type,
  };
  return gameObjectData;
}

/**
 * Converts atlas selection data to the plugin atlas data.
 * @param selection - The selection data.
 * @returns The converted array of the plugin atlas data.
 */
function convertAtlases(selection: SelectionData) {
  return selection.atlases.reduce(atlasConverter, []);
}

/**
 * Reducer function that converts atlas selection data to the plugin atlas data.
 * @param data - The cumulative plugin atlas data.
 * @param layer - The layer to convert to the plugin atlas data.
 */
function atlasConverter(data: PluginAtlasData[], layer: DataLayer): PluginAtlasData[] {
  if (isLayerAtlas(layer)) {
    const pluginData = getPluginData(layer, "defoldAtlas");
    if (pluginData) {
      data.push(pluginData);
    }
  }
  return data;
}

/**
 * Converts section selection data to the plugin section data.
 * @param selection - The selection data.
 * @returns The converted array of the plugin section data.
 */
function convertSections(selection: SelectionData) {
  return selection.sections.reduce(sectionConverter, []);
}

/**
 * Reducer function that converts section selection data to the plugin section data.
 * @param data - The cumulative plugin section data.
 * @param layer - The layer to convert to the plugin section data.
 */
function sectionConverter(data: PluginSectionData[], layer: SectionNode): PluginSectionData[] {
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
 * Generates the context data based on the selection data.
 * @param selection - The selection data.
 * @returns The plugin context data.
 */
export function generateSelectionContextData(selection: SelectionData): PluginContextData {
  if (selection.gui.length === 1) {
    const { gui: [ guiNode ] } = selection;
    return generateContextData(guiNode);
  }
  const layers = copyArray(config.sectionDefaultValues.layers);
  const materials = copyArray(config.sectionDefaultValues.materials);
  const ignorePrefixes = config.sectionDefaultValues.ignorePrefixes;
  return {
    layers,
    materials,
    ignorePrefixes,
  }
}

/**
 * Generates the selection UI metadata based on the selection data.
 * @param selection - The selection data.
 * @returns The selection UI metadata.
 */
async function generateSelectionMetaData(selection: SelectionData): Promise<SelectionUIMetaData> {
  const canTryMatch = checkForMatchingGUINodes(selection);
  const originalValues = await tryFindOriginalGUINodeData(selection);
  return { canTryMatch, originalValues };
}

/**
 * Determines whether the selected GUI node can be matched with the parent GUI node.
 * @param selection - The selection data.
 * @returns True if the selected GUI node can be matched with the parent GUI node, false otherwise.
 */
export function checkForMatchingGUINodes(selection: SelectionData): boolean {
  if (selection.gui.length === 1) {
    const [ guiNode ] = selection.gui;
    const { parent } = guiNode;
    return parent !== null && (isFigmaFrame(guiNode) || isFigmaComponentInstance(guiNode)) && isFigmaFrame(parent);
  }
  return false;
}

/**
 * Attempts to find the original GUI node data of the selected GUI node.
 * @param selection - The selection data.
 * @returns The original GUI node data.
 */
async function tryFindOriginalGUINodeData(selection: SelectionData): Promise<WithNull<PluginGUINodeData>> {
  if (selection.gui.length === 1 && isFigmaComponentInstance(selection.gui[0])) {
    const [ node ] = selection.gui; 
    const mainComponent = await findMainFigmaComponent(node);
    if (mainComponent) {
      const pluginData = getPluginData(mainComponent, "defoldGUINode");
      if (pluginData) {
        return pluginData;
      }
    }
  }
  return null;
}

/**
 * Reduces the selected section to an array of unique atlases it contains.
 * @param selection - The selection data.
 * @returns The array of unique atlases.
 */
export function reduceAtlasesFromSelectionData(selection: SelectionData): ComponentSetNode[] {
  const impliedSections = selection.atlases.reduce(impliedSectionAtlasesReducer, { sections: [], atlases: [] });
  const totalSections = removeDoubles([ ...selection.sections, ...impliedSections.sections ]);
  const restAtlases = removeDoubles([ ...impliedSections.atlases ]);
  const atlases = totalSections.reduce(sectionAtlasesReducer, [...restAtlases ]);
  return atlases;
}

function impliedSectionAtlasesReducer(impliedSections: { sections: SectionNode[], atlases: ComponentSetNode[] }, atlas: ComponentSetNode): { sections: SectionNode[], atlases: ComponentSetNode[] } {
  const atlasContextSection = findSectionWithContextData(atlas);
  if (atlasContextSection) {
    const atlasContextData = getPluginData(atlasContextSection, "defoldSection")
    if (atlasContextData?.jumbo) {
      impliedSections.sections.push(atlasContextSection);
    } else {
      impliedSections.atlases.push(atlas);
    }
  }
  return impliedSections;
}

/**
 * Reducer function that sorts atlases from the selected section.
 * @param atlases - The cumulative array of unique atlases.
 * @param section - The section to sort atlases from.
 * @returns The updated cumulative array of atlases.
 */
function sectionAtlasesReducer(atlases: ComponentSetNode[], section: SectionNode): ComponentSetNode[] {
    const sectionAtlases = section.children.filter((child) => uniqueAtlasFilter(child, atlases));
    return [ ...atlases, ...sectionAtlases ]
}

/**
 * Filter function that checks if the Figma layer is a unique atlas.
 * @param layer - The Figma layer to check.
 * @param atlases - The list of unique atlases.
 * @returns True if the layer is a unique atlas, false otherwise.
 */
function uniqueAtlasFilter(layer: SceneNode, atlases: ComponentSetNode[]): layer is ComponentSetNode {
  return isLayerAtlas(layer) && !atlases.includes(layer)
}

/**
 * Picks all the GUI nodes from the selection data.
 * @param selection - The selection data. 
 * @returns The array of GUI nodes.
 */
export function pickGUIFromSelectionData(selection: SelectionData) {
  const { gui } = selection;
  return gui;
}

/**
 * Picks the first GUI node from the selection data.
 * @param selection - The selection data.
 * @returns The first GUI node.
 */
export function pickFirstGUINodeFromSelectionData(selection: SelectionData) {
  const { gui: [ layer ] } = selection
  return layer;
}

/**
 * Picks all the game objects from the selection data.
 * @param selection - The selection data.
 * @returns The array of game objects.
 */
export function pickGameObjectsFromSelectionData(selection: SelectionData) {
  const { gameObjects } = selection;
  return gameObjects;
}

/**
 * Picks the first game object from the selection data.
 * @param selection - The selection data.
 * @returns The first game object.
 */
export function pickFirstGameObjectFromSelectionData(selection: SelectionData) {
  const { gameObjects: [ layer ] } = selection;
  return layer;
}

/**
 * Picks all the atlases from the selection data.
 * @param selection - The selection data.
 * @returns The array of atlases.
 */
export function pickFirstAtlasFromSelectionData(selection: SelectionData) {
  const { atlases: [ layer ] } = selection;
  return layer;
}

/**
 * Picks the first atlas from the selection data.
 * @param selection - The selection data.
 * @returns The first atlas.
 */
export function pickLayersFromSelectionData(selection: SelectionData) {
  const { layers } = selection;
  return layers;
}