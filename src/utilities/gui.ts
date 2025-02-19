/**
 * Handles operations with GUI nodes.
 * @packageDocumentation
 */

import config from "config/config.json";
import { getPluginData, isFigmaComponent, isFigmaComponentInstance, isFigmaRemoved, isFigmaSceneNode, isFigmaSlice, isLayerData, isLayerExportable, isLayerSprite, isLayerSpriteHolder, removePluginData } from "utilities/figma";
import { exportGUIData, exportGUIPSDData, exportGUIResources, exportGUISpineData, extractGUIAtlasData } from "utilities/guiExport";
import { postprocessGUIData, postProcessGUIPSDData, postProcessGUISpineAttachmentsData, preprocessGUIData } from "utilities/guiProcessing";
import { serializeGUIData, serializeGUISchemeData } from "utilities/guiSerialization";
import { completeGUIData, ensureGUILayer, extractGUIOriginalData, updateGUIData, updateGUILayer } from "utilities/guiUpdate";
import { inferGUINodeType } from "utilities/inference";
import { isVector4 } from "utilities/math";
import { isSlice9PlaceholderLayer } from "utilities/slice9";

export const GUI_EXPORT_PIPELINE: TransformPipeline<GUIExportPipelineData, GUIData> = {
  extractResources: exportGUIResources,
  beforeTransform: preprocessGUIData,
  transform: exportGUIData,
  afterTransform: postprocessGUIData,
}

export const GUI_SERIALIZATION_PIPELINE: TransformPipeline<GUIData, SerializedGUIData> = {
  transform: serializeGUIData,
}

export const GUI_SCHEME_SERIALIZATION_PIPELINE: TransformPipeline<GUIData, SerializedGUIData> = {
  transform: serializeGUISchemeData
}

export const GUI_ATLASES_EXTRACT_PIPELINE: TransformPipeline<GUIExportPipelineData, AtlasLayer[]> = {
  extractResources: exportGUIResources,
  transform: extractGUIAtlasData,
}

export const GUI_SPINES_EXPORT_PIPELINE: TransformPipeline<GUIData, SpineData> = {
  transform: exportGUISpineData,
}

export const GUI_SPINE_ATTACHMENTS_EXPORT_PIPELINE: TransformPipeline<GUIData, SpineData> = {
  transform: exportGUISpineData,
  afterTransform: postProcessGUISpineAttachmentsData,
}

export const GUI_PSD_EXPORT_PIPELINE: TransformPipeline<GUIData, PSDData> = {
  transform: exportGUIPSDData,
  afterTransform: postProcessGUIPSDData,
}

export const GUI_UPDATE_PIPELINE: UpdatePipeline<PluginGUINodeData> = {
  ensureLayer: ensureGUILayer,
  extractOriginalData: extractGUIOriginalData,
  beforeUpdate: completeGUIData,
  update: updateGUIData,
  afterUpdate: updateGUILayer,
}

/**
 * Determines whether the GUI node type is box.
 * @param type - The type to check.
 * @returns True if the type is box, otherwise false.
 */
export function isGUIBoxType(type: GUINodeType) {
  return type === "TYPE_BOX";
}

/**
 * Determines whether the GUI node type is text.
 * @param type - The type to check.
 * @returns True if the type is text, otherwise false.
 */
export function isGUITextType(type: GUINodeType) {
  return type === "TYPE_TEXT";
}

/**
 * Determines whether the GUI node type is template.
 * @param type - The type to check.
 * @returns True if the type is template, otherwise false.
 */
export function isGUITemplateType(type: GUINodeType) {
  return type === "TYPE_TEMPLATE";
}

/**
 * Determines whether the Figma layer is a GUI node template.
 * @param layer - The Figma layer to check.
 * @returns True if the Figma layer is a GUI node template, otherwise false.
 */
export function isGUITemplate(layer: ExportableLayer) {
  if (isLayerData(layer)) {
    const pluginData = getPluginData(layer, "defoldGUINode");
    if (pluginData) {
      const { template } = pluginData;
      return template;
    }
  }
  return false;
}

export function hasGUITexture(node: GUINodeData): node is GUINodeData & { texture: string, texture_size: Vector4 } {
  return !!node.texture && typeof node.texture === "string" && !!node.texture_size && isVector4(node.texture_size)
}

/**
 * Retrieves the GUI node plugin data bound to the Figma layer, from default and inferred values.
 * @param layer - The Figma layer to retrieve the plugin data from.
 * @returns The GUI node plugin data.
 */
export function getGUINodePluginData(layer: Exclude<ExportableLayer, SliceLayer>): PluginGUINodeData {
  const pluginData = getPluginData(layer, "defoldGUINode");
  const id = pluginData?.id || layer.name;
  const type = pluginData?.type || inferGUINodeType(layer);
  const exportVariants = pluginData?.export_variants || "";
  return {
    ...config.guiNodeDefaultValues,
    ...config.guiNodeDefaultSpecialValues,
    ...pluginData,
    id,
    type,
    export_variants: exportVariants,
    figma_node_type: layer.type,
  }
}

/**
 * Resolves the GUI node plugin data from the Figma layer.
 * @param layer - The Figma layer to resolve the plugin data from.
 * @returns The resolved GUI node plugin data or null if not found.
 */
export function resolveGUINodePluginData(layer: ExportableLayer) {
  if (!isFigmaSlice(layer)) {
    const data = getPluginData(layer, "defoldGUINode");
    if (data) {
      return data;
    }
  }
  return null;
}

/**
 * Purges unused GUI node override plugin data from the document.
 */
export function purgeUnusedGUIOverridesPluginData() {
  const { root: document } = figma;
  const keys = document.getPluginDataKeys();
  keys.forEach(tryPurgeUnusedGUINodeOverridesPluginData);
}

/**
 * Attempts to purge unused GUI node override plugin data.
 * @async
 * @param key - The key to check.
 */
async function tryPurgeUnusedGUINodeOverridesPluginData(key: string) {
  if (isGUINodeOverridesDataKey(key)) {
    const { root: document } = figma;
    const id = parseLayerIDFromGUINodeOverridesDataKey(key);
    const layer = await figma.getNodeByIdAsync(id);
    if (shouldPurgeGUINodeOverridesPluginData(layer)) {
      removePluginData(document, key);
    }
  }
}

/**
 * Determines whether the GUI node override plugin data should be purged.
 * @param layer - The Figma layer to check.
 * @returns True if the GUI node overrides plugin data should be purged, otherwise false.
 */
function shouldPurgeGUINodeOverridesPluginData(layer: WithNull<BaseNode>) {
  return !layer || (isFigmaSceneNode(layer) && isFigmaRemoved(layer))
}

/**
 * Attempts to remove GUI node override plugin data.
 * @async
 * @param layer - The Figma layer to remove the plugin data from.
 */
export async function tryRemoveGUINodeOverridesPluginData(layer: DataLayer) {
  if (await canChangeGUINodeOverridesPluginData(layer)) {
    removeGUINodeOverridesPluginData(layer);
  }
}

/**
 * Determines whether the GUI node override plugin data can be changed.
 * @async
 * @param layer - The Figma layer to check.
 * @returns True if the GUI node override plugin data can be changed, otherwise false.
 */
export async function canChangeGUINodeOverridesPluginData(layer: DataLayer) {
  return isFigmaComponentInstance(layer) && !await isLayerSprite(layer);
}

/**
 * Removes GUI node override plugin data.
 * @param layer - The Figma layer to remove the override plugin data for.
 */
export function removeGUINodeOverridesPluginData(layer: DataLayer | RemovedNode) {
  const { root: document } = figma;
  const { id } = layer;
  const key = resolveGUINodeOverridesDataKey(id);
  removePluginData(document, key);
}

/**
 * Resolves the GUI node name prefix.
 * @param shouldSkip - Whether the GUI node should be skipped.
 * @param options - The GUI node data export options.
 * @returns The resolved GUI node name prefix.
 */
export function resolveGUINodeNamePrefix(shouldSkip: boolean, options: GUINodeDataExportOptions): string {
  if (shouldSkip) {
    if (options.namePrefix) {
      return options.namePrefix;
    }
    return "";
  } else if (isFigmaComponentInstance(options.layer) || isFigmaComponent(options.layer)) {
    if (options.namePrefix) {
      return `${options.namePrefix}${options.layer.name}_`;
    }
    return `${options.layer.name}_`;
  } if (options.namePrefix) {
    return options.namePrefix;
  }
  return "";
}

/**
 * Resolves the GUI node forced name.
 * @param layer - The Figma layer to resolve the forced name for.
 * @returns The resolved GUI node forced name.
 */
export async function resolveGUINodeForcedName(layer: ExportableLayer, parentOptions: GUINodeDataExportOptions, parentGUINodeData: GUINodeData): Promise<string | undefined> {
  const { parent } = layer;
  if (parent) {
    if (parentGUINodeData.skip && parentOptions.forcedName && isSlice9PlaceholderLayer(parent)) {
      return parentOptions.forcedName;
    }
    if (isLayerExportable(parent) && await isLayerSpriteHolder(parent)) {
      return parent.name
    }
  }
  return undefined;
}

/**
 * Resolves the GUI node file path.
 * @param pluginData - The plugin data to resolve the file path from.
 * @returns The resolved GUI node file path.
 */
export function resolveGUIFilePath(data?: WithNull<PluginGUINodeData>) {
  return data?.path || config.guiNodeDefaultSpecialValues.path;
}

/**
 * Resolves the GUI node type.
 * @param layer - The Figma layer to resolve the type for.
 * @param pluginData - The plugin data to resolve the type from.
 * @returns The resolved GUI node type.
 */
export function resolvesGUINodeType(layer: ExportableLayer, pluginData?: WithNull<PluginGUINodeData>): GUINodeType {
  if (pluginData?.template) {
    return "TYPE_TEMPLATE";
  }
  return inferGUINodeType(layer);
}

/**
 * Resolves components of the export variant.
 * @param exportVariant - The export variant to resolve the components from.
 * @returns The resolved export variant components.
 */
export function resolveGUINodeExportVariantComponents(exportVariant: string) {
  return exportVariant.split("=").map(value => value.trim());
}

/**
 * Determines whether the key is a GUI node override plugin data key.
 * @param key - The key to check.
 * @returns True if the key is a GUI node override plugin data key, otherwise false.
 */
export function isGUINodeOverridesDataKey(key: string): key is PluginGUINodeDataOverrideKey {
  return key.startsWith("defoldGUINodeOverride-");
}

/**
 * Resolves the GUI node override plugin data key.
 * @param id - The ID to resolve the key from.
 * @returns The resolved GUI node override plugin data key.
 */
export function resolveGUINodeOverridesDataKey(id: string): PluginGUINodeDataOverrideKey {
  const key: PluginGUINodeDataOverrideKey = `defoldGUINodeOverride-${id}`;
  return key;
}

/**
 * Parses the layer ID from the GUI node override plugin data key.
 * @param key - The key to parse the layer ID from.
 * @returns The parsed layer id.
 */
export function parseLayerIDFromGUINodeOverridesDataKey(key: PluginGUINodeDataOverrideKey): string {
  return key.replace("defoldGUINodeOverride-", "");
}
