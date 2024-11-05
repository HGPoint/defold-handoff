/**
 * Handles operations with game objects and collections.
 * @packageDocumentation
 */

import config from "config/config.json";
import { getPluginData, isFigmaComponent, isFigmaComponentInstance, isFigmaSlice, isLayerExportable, isLayerSpriteHolder } from "utilities/figma";
import { exportGameCollectionData, exportGameCollectionResources, extractGameCollectionAtlasData } from "utilities/gameCollectionExport";
import { postprocessGameCollectionData, preprocessGameCollectionData } from "utilities/gameCollectionProcessing";
import { serializeGameCollectionData } from "utilities/gameCollectionSerialization";
import { ensureGameObjectLayer, extractGameObjectOriginalData, preprocessGameObjectData, updateGameObjectData, updateGameObjectLayer } from "utilities/gameCollectionUpdate";
import { inferGameObjectType } from "utilities/inference";
import { calculateHypotenuse } from "utilities/math";
import { isSlice9PlaceholderLayer } from "utilities/slice9";

export const GAME_COLLECTION_EXPORT_PIPELINE: TransformPipeline<ExportableLayer, GameCollectionData> = {
  extractResources: exportGameCollectionResources,
  beforeTransform: preprocessGameCollectionData,
  transform: exportGameCollectionData,
  afterTransform: postprocessGameCollectionData,
}

export const GAME_COLLECTION_SERIALIZATION_PIPELINE: TransformPipeline<GameCollectionData, SerializedGameCollectionData> = {
  transform: serializeGameCollectionData,
}

export const GAME_COLLECTION_ATLASES_EXTRACT_PIPELINE: TransformPipeline<ExportableLayer, AtlasLayer[]> = {
  extractResources: exportGameCollectionResources,
  transform: extractGameCollectionAtlasData,
}

export const GAME_OBJECT_UPDATE_PIPELINE: UpdatePipeline<PluginGameObjectData> = {
    ensureLayer: ensureGameObjectLayer,
    extractOriginalData: extractGameObjectOriginalData,
    beforeUpdate: preprocessGameObjectData,
    update: updateGameObjectData,
    afterUpdate: updateGameObjectLayer,
}

/**
 * Determines whether the game object type is empty.
 * @param type - The type to check.
 * @returns True if the type is empty, otherwise false.
 */
export function isGameObjectEmptyType(type?: GameObjectType) {
  return type === "TYPE_EMPTY";
}

/**
 * Determines whether the game object type is sprite.
 * @param type - The type to check.
 * @returns True if the type is sprite, otherwise false.
 */
export function isGameObjectSpriteType(type?: GameObjectType) {
  return type === "TYPE_SPRITE";
}

/**
 * Determines whether the game object type is label.
 * @param type - The type to check.
 * @returns True if the type is label, otherwise false.
 */
export function isGameObjectLabelType(type?: GameObjectType) {
  return type === "TYPE_LABEL";
}

/**
 * Retrieves the game object plugin data bound to the Figma layer, from default and inferred values.
 * @param layer - The Figma layer to retrieve the plugin data from.
 * @returns The game object plugin data.
 */
export async function getGameObjectPluginData(layer: Exclude<ExportableLayer, SliceLayer>): Promise<PluginGameObjectData> {
  const pluginData = getPluginData(layer, "defoldGameObject");
  const id = pluginData?.id || layer.name;
  const type = pluginData?.type || await inferGameObjectType(layer);
  return {
    ...config.gameObjectDefaultValues,
    ...config.gameObjectDefaultSpecialValues,
    ...pluginData,
    id,
    type,
    figma_node_type: layer.type,
  }
}

/**
 * Resolves the game object plugin data from the Figma layer.
 * @param layer - The Figma layer to resolve the plugin data from.
 * @returns The resolved game object plugin data or null if not found.
 */
export function resolveGameObjectPluginData(layer: ExportableLayer) {
  if (!isFigmaSlice(layer)) {
    const data = getPluginData(layer, "defoldGameObject")
    if (data) {
      return data;
    }
  }
  return null;
}

/**
 * Resolves the game collection name from the game object plugin data.
 * @param pluginData - The plugin data to resolve the name from.
 * @returns The resolved game object name.
 */
export function resolveGameCollectionName(pluginData?: WithNull<PluginGameObjectData>) {
  return pluginData?.id ? pluginData.id : config.gameCollectionDefaultValues.name;
}

/**
 * Resolves the game object name prefix.
 * @param shouldSkip - Whether the game object should be skipped.
 * @param options - The game object data export options.
 * @returns The resolved game object name prefix.
 */
export function resolveGameObjectNamePrefix(shouldSkip: boolean, options: GameObjectDataExportOptions): string {
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
 * Resolves the game object forced name.
 * @async
 * @param layer - The Figma layer to resolve the name from.
 * @param parentOptions - The parent game object data export options.
 * @param parentGameObjectData - The parent game object data.
 * @returns The resolved game object forced name.
 */ 
export async function resolveGameObjectForcedName(layer: ExportableLayer, parentOptions: GameObjectDataExportOptions, parentGameObjectData: GameObjectData): Promise<string | undefined> {
  const { parent } = layer;
  if (parent) {
    if (parentGameObjectData.skip && parentOptions.forcedName && isSlice9PlaceholderLayer(parent)) {
      return parentOptions.forcedName;
    }
    if (isLayerExportable(parent) && await isLayerSpriteHolder(parent)) {
      return parent.name
    }
  }
  return undefined;
}

/**
 * Resolves the game collection file path.
 * @param data - The game object plugin data to resolve the file path from.
 * @returns The resolved game collection file path.
 */
export function resolveGameCollectionFilePath(data?: WithNull<PluginGameObjectData>) {
  return data?.path || config.gameObjectDefaultSpecialValues.path;
}

/**
 * Resolves the game object type ID.
 * @param type - The game object type to resolve the ID from.
 * @returns The resolved game object type ID.
 */
export function resolveGameComponentTypeId(type?: GameObjectType) {
  if (!type) {
    return "empty";
  }
  return type.replace("TYPE_", "").toLowerCase();
}

/**
 * Resolves the game object depth axis parameters.
 * @param data - The game object plugin data to resolve the depth axis parameters from.
 * @returns The resolved game object depth axis parameters.
 */
export function resolveDepthAxisParameters(data?: WithNull<PluginGameObjectData | GameObjectData>) {
  const arrangeDepth = data?.arrange_depth || config.gameObjectDefaultSpecialValues.arrange_depth;
  const depthAxis = data?.depth_axis || config.gameObjectDefaultSpecialValues.depth_axis;
  return { arrangeDepth, depthAxis };
}

/**
 * Calculates the game object depth based on the position.
 * @param x - The x coordinate.
 * @param y - The y coordinate.
 * @param z - The z coordinate.
 * @param arrangeDepth - Whether to arrange the depth.
 * @param depthAxis - The depth axis to use.
 */
export function calculateGameObjectDepth(x: number, y: number, z: number, arrangeDepth: boolean, depthAxis?: string) {
  if (arrangeDepth) {
    depthAxis = depthAxis || config.gameObjectDefaultSpecialValues.depth_axis;
    const { axis, step } = parseDepthParameters(depthAxis);
    if (isDepthAxisXY(axis)) {
      const distance = calculateHypotenuse(x, y);
      const depth = distance * step;
      return depth;
    } else if (isDepthAxisX(axis)) {
      const depth = x * step;
      return depth;
    } else if (isDepthAxisY(axis)) {
      const depth = y * step;
      return depth;
    }
  }
  return z;
}

/**
 * Parses the depth axis parameters.
 * @param depthAxis - The depth axis to parse.
 * @returns The parsed depth axis parameters.
 */
function parseDepthParameters(depthAxis: string) {
  const xPosition = depthAxis.toLocaleLowerCase().indexOf("x");
  const yPosition = depthAxis.toLocaleLowerCase().indexOf("y");
  const indexStart = xPosition > yPosition ? xPosition : yPosition;
  const step = parseFloat(depthAxis.slice(indexStart + 1));
  const axis = `${xPosition !== -1 ? "x" : ""}${yPosition !== -1 ? "y" : ""}`;
  return { axis, step };
}

/**
 * Determines whether the depth axis is x.
 * @param axis - The depth axis to check.
 * @returns True if the depth axis is x, otherwise false.
 */
function isDepthAxisX(axis: string) {
  return axis.includes("x");
}

/**
 * Determines whether the depth axis is y.
 * @param axis - The depth axis to check.
 * @returns True if the depth axis is y, otherwise false.
 */
function isDepthAxisY(axis: string) {
  return axis.includes("y");
}

/**
 * Determines whether the depth axis is x and y.
 * @param axis - The depth axis to check.
 * @returns True if the depth axis is x and y, otherwise false.
 */
function isDepthAxisXY(axis: string) {
  const axisXY = isDepthAxisX(axis) && isDepthAxisY(axis);
  return axisXY;
}