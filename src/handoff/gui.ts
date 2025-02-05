/**
 * Provides endpoints for managing GUI-related features, including editing, updating, and exporting GUI nodes.
 * @packageDocumentation
 */

import { PROJECT_CONFIG } from "handoff/project";
import { fitLayerToChildLayer, fitLayerToParentLayer, isFigmaBox, isFigmaComponent, isFigmaFrame, isFigmaText, isLayerData, removePluginData, setPluginData } from "utilities/figma";
import { canChangeGUINodeOverridesPluginData, getGUINodePluginData, GUI_EXPORT_PIPELINE, GUI_SCHEME_SERIALIZATION_PIPELINE, GUI_SERIALIZATION_PIPELINE, GUI_UPDATE_PIPELINE, resolveGUINodePluginData, tryRemoveGUINodeOverridesPluginData } from "utilities/gui";
import { packGUI, packGUINode } from "utilities/guiExport";
import { inferGUI, inferGUIText } from "utilities/inference";
import { findSlice9Layer, findSlice9PlaceholderLayer, isSlice9Layer, isSlice9PlaceholderLayer } from "utilities/slice9";
import { runTransformPipeline, runTransformPipelines } from "utilities/transformPipeline";
import { runUpdatePipeline, runUpdatePipelines } from "utilities/updatePipeline";

/**
 * Logs GUI data from an array of GUI layers.
 * @param layers - The GUI nodes to log.
 */
export function logGUI(layers: ExportableLayer[]) {
  layers.forEach(logGUINode);
}

/**
 * Logs GUI data from a GUI node layer.
 * @param layer - The GUI node to log.
 */
function logGUINode(layer: ExportableLayer) {
  const data = resolveGUINodePluginData(layer);
  if (data) {
    console.log(data)
  }
}

/**
 * Exports serialized GUI data from an array of GUI layers.
 * @param layers - The GUI nodes to export.
 * @returns An array of serialized GUI data.
 */
export async function exportGUI(layers: ExportableLayer[], textAsSprites: boolean = false, collapseEmpty: boolean = false, collapseTemplates: boolean = false): Promise<SerializedGUIData[]> {
  const data = packGUI(layers, textAsSprites, collapseEmpty, collapseTemplates);
  const exportGUIData = await runTransformPipelines(GUI_EXPORT_PIPELINE, data);
  const serializedGUIData = await runTransformPipelines(GUI_SERIALIZATION_PIPELINE, exportGUIData);
  return serializedGUIData;
}

/**
 * Exports serialized GUI data from a GUI node layer.
 * @param layer - The GUI node to export.
 * @returns Serialized GUI data.
 */
export async function copyGUI(layer: ExportableLayer, textAsSprites: boolean = false, collapseEmpty: boolean = false, collapseTemplates: boolean): Promise<SerializedGUIData> {
  const data = packGUINode(layer, textAsSprites, collapseEmpty, collapseTemplates);
  const exportGUIData = await runTransformPipeline(GUI_EXPORT_PIPELINE, data);
  const serializedGUIData = await runTransformPipeline(GUI_SERIALIZATION_PIPELINE, exportGUIData);
  return serializedGUIData;
}

/**
 * Exports GUI scheme boilerplate code from a GUI node layer.
 * @param layer - The GUI node to export.
 * @returns GUI scheme boilerplate code.
 */
export async function copyGUIScheme(layer: ExportableLayer): Promise<SerializedGUIData> {
  const data = packGUINode(layer);
  const exportGUIData = await runTransformPipeline(GUI_EXPORT_PIPELINE, data);
  const serializedGUIData = await runTransformPipeline(GUI_SCHEME_SERIALIZATION_PIPELINE, exportGUIData);
  return serializedGUIData;
}

/**
 * Updates the data bound to each of the GUI node layers.
 * @param layers - The GUI nodes to update.
 * @param updates - The data updates to apply to each GUI node.
 * @returns An array of results for each GUI node update.
 */
export async function updateGUI(layers: DataLayer[], updates: PluginGUINodeData[]) {
  const result = await runUpdatePipelines(GUI_UPDATE_PIPELINE, layers, updates); 
  return result;
}

/**
 * Updates the data bound to a GUI node layer.
 * @param layer - The GUI node to update.
 * @param update - The update data to apply.
 * @returns True if the update was successful, false otherwise.
 */
export async function updateGUINode(layer: DataLayer, update: PluginGUINodeData) {
  const result = await runUpdatePipeline(GUI_UPDATE_PIPELINE, layer, update);
  return result;
}

/**
 * Destroys an array of GUI nodes, by removing bound GUI data from the Figma layers.
 * @param layers - The GUI nodes to destroy.
 */
export function removeGUI(layers: SceneNode[]) {
  layers.forEach(tryRemoveGUINode);
}

/**
 * Attempts to destroy a GUI node, by removing bound GUI data from the Figma layer.
 * @param layers - The GUI nodes to destroy.
 */
function tryRemoveGUINode(layer: SceneNode) {
  if (isLayerData(layer)) {
    removeGUINode(layer);
  }
}

/**
 * Destroys a GUI node, by removing bound GUI data from the Figma layer.
 * @param layer - Figma layer to reset GUI node data for.
 */
export function removeGUINode(layer: DataLayer) {
  removePluginData(layer, "defoldGUINode");
  removePluginData(layer, "defoldSlice9");
  tryRemoveGUINodeOverridesPluginData(layer)
}

/**
 * Pulls GUI node data from the main component for each Figma layer from an array.
 * @param layers - The layers to pull GUI node data for.
 */
export function resetGUIOverrides(layers: SceneNode[]) {
  layers.map(tryResetGUINodeOverrides);
}

/**
 * Attempts to reset data overrides for a GUI node layer.
 * @param layer - The layer to pull GUI node data for.
 */
async function tryResetGUINodeOverrides(layer: SceneNode) {
  if (isLayerData(layer) && await canChangeGUINodeOverridesPluginData(layer)) {
    removeGUINode(layer);
  }
}

/**
 * Infers GUI data from an array of Figma layers.
 * @param layers - The Figma layers to infer data for.
 */
export function fixGUI(layers: SceneNode[]) {
  inferGUI(layers, true, true);
}

/**
 * Attempts to infer GUI data for a text node from a Figma layer.
 * @param layer - The Figma layer to infer data for.
 */
export function tryFixGUIText(layer: SceneNode) {
  if (isFigmaText(layer)) {
    inferGUIText(layer);
  }
}


/**
 * Attempts to match GUI node layer to the dimensions of the parent GUI node layer.
 * @param layer - The GUI node to match to the parent.
 */
export function tryMatchGUINodeToGUIParent(layer: ExportableLayer) {
  if (isFigmaBox(layer)) {
    matchGUINodeToGUIParent(layer);
  }
}

/**
 * Matches GUI node layer to the dimensions of the parent GUI node layer.
 * @param layer - The GUI node to match to the parent.
 */
function matchGUINodeToGUIParent(layer: BoxLayer) {
  const actualLayer = isSlice9Layer(layer) ? findSlice9PlaceholderLayer(layer) : layer;
  if (actualLayer) {
    const { parent } = actualLayer;
    if (parent && isFigmaBox(parent)) {
      fitLayerToParentLayer(parent, actualLayer);
    }
  }
}

/**
 * Attempts to match parent GUI node layer to the dimensions of the GUI node layer.
 * @param layer - The GUI node to match parent to.
 */
export function tryMatchGUINodeToGUIChild(layer: ExportableLayer) {
  if (isFigmaBox(layer)) {
    matchGUIToGUIChild(layer);
  }
}

/**
 * Matches parent GUI node layer to the dimensions of the GUI node layer.
 * @param layer - The GUI node to match parent to.
 */
function matchGUIToGUIChild(layer: BoxLayer) {
  const actualLayer = isSlice9Layer(layer) ? findSlice9PlaceholderLayer(layer) : layer;
  if (actualLayer) {
    const { parent } = actualLayer;
    if (parent && isFigmaBox(parent)) {
      fitLayerToChildLayer(parent, actualLayer);
    }
  }
}

/**
 * Attempts to resize GUI node layers to the dimensions of the screen.
 * @param layers - The GUI nodes to resize.
 */
export function resizeGUIToScreen(layers: SceneNode[]) {
  layers.forEach(tryResizeGUINodeToScreen);
}

/**
 * Attempts to resize GUI node layer to the dimensions of the screen.
 * @param layer - The GUI node to resize.
 */
function tryResizeGUINodeToScreen(layer: SceneNode) {
  if (isFigmaFrame(layer) || isFigmaComponent(layer)) {
    resizeGUINodeToScreen(layer);
  }
}

/**
 * Resizes GUI node layer to the dimensions of the screen.
 * @param layer - The GUI node to resize.
 */
function resizeGUINodeToScreen(layer: FrameNode | ComponentNode) {
  const { screenSize: { x, y } } = PROJECT_CONFIG;
  layer.resize(x, y);
}

/**
 * Attempts to force all direct children of the given GUI node layer to be exported "on screen".
 * @param layer - The GUI node to force the children "on screen" for.
 */
export function tryForceGUIChildrenOnScreen(layer: SceneNode) {
  if (isFigmaBox(layer)) {
    layer.children.forEach(tryForceGUIChildOnScreen);
  }
}

/**
 * Attempts to force a GUI node layer to be exported "on screen".
 * @param layer - The GUI node to force "on screen".
 */
function tryForceGUIChildOnScreen(layer: SceneNode) {
  const originalLayer = isSlice9PlaceholderLayer(layer) ? findSlice9Layer(layer) : layer;
  if (originalLayer && isFigmaBox(originalLayer)) {
    forceGUIChildOnScreen(originalLayer);
  }
}

/**
 * Forces a GUI node layer to be exported "on screen".
 * @param layer - The GUI node to force "on screen".
 */
function forceGUIChildOnScreen(layer: BoxLayer) {
  const pluginData = getGUINodePluginData(layer);
  const guiNodeData = { defoldGUINode: { ...pluginData, screen: true } };
  setPluginData(layer, guiNodeData);
}