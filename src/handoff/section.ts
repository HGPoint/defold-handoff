/**
 * Module for managing organizational sections in Figma.
 * @packageDocumentation
 */

import { getPluginData, setPluginData, removePluginData } from "utilities/figma";

/**
 * Updates the section data for a given section layer.
 * @param layer - The section layer to update.
 * @param data - The section data update.
 */
export function updateSection(layer: SectionNode, data: PluginSectionData) {
  const pluginData = getPluginData(layer, "defoldSection");
  const guiNodeData = { defoldSection: { ...pluginData, ...data } };
  setPluginData(layer, guiNodeData); 
}

/**
 * Removes bound section data for a given Figma section.
 * @param layer - The section layer to reset.
 */
export function removeSection(layer: SceneNode) {
  removePluginData(layer, "defoldSection");
}

/**
 * Removes bound section data for an array of Figma sections.
 * @param layers - The section layers to reset.
 */
export function removeSections(layers: SceneNode[]) {
  layers.forEach((layer) => { removeSection(layer) });
}