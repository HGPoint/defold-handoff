/**
 * Handles GUI layer data, including extraction and processing of it.
 * @packageDocumentation
 */

import { generateContextData } from "utilities/context";

/**
 * Extracts layer data for a GUI node layer.
 * @param layer - The GUI node layer to extract the context data for.
 * @returns An array of layers.
 */
export function extractLayerData(layer: ExportableLayer) {
  const context = generateContextData(layer);
  const layers = resolveLayers(context);
  return layers;
}

/**
 * Resolves the layer names from the context data.
 * @param context - The context data to resolve the layer names from.
 * @returns An array of layer names.
 */
function resolveLayers({ layers }: PluginContextData) {
  return layers.reduce(layerReducer, [] as string[]);
}

/**
 * Reducer function that extracts the layer names from the layer data.
 * @param layers - The cumulative array of layer names.
 * @param layerData - The layer data to extract the name from.
 * @returns The updated array of layer names.
 */
function layerReducer(layers: string[], layerData: ProjectLayerData) {
  if (layerData.id === "DEFAULT") {
      return layers;
  }
  const { name } = layerData;
  return [ ...layers, name ];
}