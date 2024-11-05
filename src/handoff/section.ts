/**
 * Provides endpoints for managing contextual resource organization features using Figma sections, primarily focusing on configuration (e.g., bundling and combining atlases, managing layers and materials).
 * @packageDocumentation
 */

import { getPluginData, setPluginData, removePluginData } from "utilities/figma";

/**
 * Updates the data bound to a section.
 * @param layer - The section to update.
 * @param update - The update data to apply.
 */
export function updateSection(layer: SectionNode, update: PluginSectionData) {
  const pluginData = getPluginData(layer, "defoldSection");
  const guiNodeData = { defoldSection: { ...pluginData, ...update } };
  setPluginData(layer, guiNodeData); 
}

/**
 * Destroys an array of context sections, by removing bound context section data from the Figma sections.
 * @param layers - The context sections to destroy.
 */
export function removeSections(layers: SectionNode[]) {
  layers.forEach(removeSection);
}


/**
 * Destroys a context section, by removing bound context section data from the Figma layer.
 * @param layer - The section layer to reset.
 */
export function removeSection(layer: SectionNode) {
  removePluginData(layer, "defoldSection");
}
