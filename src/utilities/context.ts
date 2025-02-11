/**
 * Handles contextual resource organization (e.g., bundling and combining atlases, managing layers and materials).
 * @packageDocumentation
 */

import config from "config/config.json";
import { getPluginData, isFigmaPage, isLayerContextSection } from "utilities/figma";

/**
 * Generates the context data for a Figma layer.
 * @param layer - The layer for which to generate the context data.
 * @returns The context data.
 */
export function generateContextData(layer: SceneNode): PluginContextData {
  const section = findSectionWithContextData(layer);
  if (section) {
    return generateContextDataFromSection(section);
  }
  return generateDefaultContextData();
}

/**
 * Recursively locates the section containing context data for a Figma layer.
 * @param layer - The layer for which to locate the section with context data.
 * @returns The section with context data.
 */
export function findSectionWithContextData(layer: BaseNode): WithNull<SectionNode> {
  if (!layer || isFigmaPage(layer)) {
    return null;
  }
  if (isLayerContextSection(layer)) {
    return layer;
  }
  const { parent } = layer;
  if (parent) {
    return findSectionWithContextData(parent)
  }
  return null;
}

/**
 * Generates the context data from a section.
 * @param section - The context section to generate the context data from.
 * @returns The context data.
 */
function generateContextDataFromSection(section: SectionNode): PluginContextData {
  const pluginData = getPluginData(section, "defoldSection");
  const layers = [ ...config.sectionDefaultValues.layers, ...(pluginData?.layers || []) ];
  const materials = pluginData?.materials || config.sectionDefaultValues.materials;
  const ignorePrefixes = pluginData?.ignorePrefixes || config.sectionDefaultValues.ignorePrefixes;
  return {
    layers,
    materials,
    ignorePrefixes
  }
}

/**
 * Generates the default context data.
 * @returns The context data.
 */
function generateDefaultContextData(): PluginContextData {
  const { layers, materials, ignorePrefixes } = config.sectionDefaultValues;
  return {
    layers,
    materials,
    ignorePrefixes,
  }
}
