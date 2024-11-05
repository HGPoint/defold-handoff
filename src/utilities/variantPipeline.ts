/**
 * Provides pipeline for iterating over Figma component variants.
 * @packageDocumentation
 */

import delay from "utilities/delay";
import { getPluginData, isFigmaComponentInstance, isLayerData } from "utilities/figma";

export async function runVariantPipeline<TData extends { layer: SceneNode }, TProcessedData>(pipeline: VariantPipeline<TData, TProcessedData>, input: TData, data: TProcessedData) {
  const { layer } = input;
  const variants = extractExportVariants(layer);
  if (variants) {
    data = await processVariants<TData, TProcessedData>(input, variants, pipeline, data);
  }
  return data;
}

async function processVariants<TData extends { layer: SceneNode }, TProcessedData>(input: TData, variants: Record<string, string[]>, pipeline: VariantPipeline<TData, TProcessedData>, data: TProcessedData) {
  const { layer } = input;
  if (isFigmaComponentInstance(layer)) {
    const initialVariant = resolveInitialVariantValues(layer, variants);
    const variantPairs = Object.entries(variants);
    for (const [ variantName, variantValues ] of variantPairs) {
      data = await processVariantGroup<TData, TProcessedData>(input, variantName, variantValues, pipeline, data);
      await switchVariantLayer(layer, variantName, initialVariant[variantName]);
    }
  }
  return data;
}

async function processVariantGroup<TData extends { layer: SceneNode }, TProcessedData>(input: TData, variantName: string, variantValues: string[], pipeline: VariantPipeline<TData, TProcessedData>, data: TProcessedData) {
  const { layer } = input;
  if (isFigmaComponentInstance(layer)) {
    for (const variantValue of variantValues) {
      await switchVariantLayer(layer, variantName, variantValue);
      const variantData = await pipeline.process(input);
      data = { ...data, ...variantData };
    }
  }
  return data;
}

export function extractExportVariants(layer: SceneNode) {
  if (isLayerData(layer)) {
    const pluginData = getPluginData(layer, "defoldGUINode");
    if (pluginData?.export_variants) {
      const variantPairs = pluginData.export_variants.split(",");
      const exportVariants = resolveExportVariants(variantPairs);
      return exportVariants;
    }
  }
  return null;
}

export function resolveExportVariants(variantPairs: string[]) {
  return variantPairs.reduce(extractedExportVariantReducer, {});
}

function extractedExportVariantReducer(exportVariants: Record<string, string[]>, variantPair: string) {
  const [variantName, variantValue] = variantPair.split("=");
  if (variantName && variantValue) {
    if (!exportVariants[variantName]) {
      exportVariants[variantName] = [];
    }
    exportVariants[variantName].push(variantValue);
  }
  return exportVariants;
}

export function resolveInitialVariantValues(layer: SceneNode, variants: Record<string, string[]>) {
  const initialVariant: Record<string, string> = {};
  if (isFigmaComponentInstance(layer)) {
    for (const variantName of Object.keys(variants)) {
      if (layer.variantProperties && !!layer.variantProperties[variantName]) {
        initialVariant[variantName] = layer.variantProperties[variantName];
      }
    }
  }
  return initialVariant;
}

async function switchVariantLayer(layer: InstanceNode, variantName: string, variantValue: string) {
  layer.setProperties({ [variantName]: variantValue });
  await delay(100);
}
