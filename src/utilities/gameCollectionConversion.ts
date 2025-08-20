/**
 * Handles game-related data conversion from Figma into Defold-like properties.
 * @packageDocumentation
 */

import config from "config/config.json";
import { generateContextData } from "utilities/context";
import { isLayerSkippable } from "utilities/data";
import { injectEmptyComponentDefaults, injectGameCollectionDefaults, injectLabelComponentDefaults, injectSpriteComponentDefaults } from "utilities/defaults";
import { getPluginData, hasChildren, isFigmaBox, isFigmaPage, isFigmaSection, isFigmaSlice, isFigmaText } from "utilities/figma";
import { calculateGameObjectDepth, isGameObjectEmptyType, resolveFigmaLayerIndex, resolveGameCollectionName, resolveGameObjectDepthLayer, resolveGameObjectPluginData, resolveGameObjectZCoordinate } from "utilities/gameCollection";
import { inferColor, inferFigmaPosition, inferFigmaSize, inferGameObjectType, inferLineBreak, inferRotation, inferScale, inferSize, inferSizeMode, inferSlice9, inferSpriteComponentSprite, inferText, inferTextBoxSize, inferTextLeading, inferTextOutline, inferTextPivot, inferTextScale, inferTextShadow, inferTextTracking } from "utilities/inference";
import { readableVector, vector4 } from "utilities/math";
import { addPositionParentShift, calculateCenteredPosition, convertCenteredPositionToPivotedPosition } from "utilities/pivot";
import { isSlice9PlaceholderLayer } from "utilities/slice9";

/**
 * Converts the game collection to a Defold-like data. 
 * @param rootData - The root plugin data of the game collection.
 * @returns The converted game collection data.
 */
export function convertGameCollectionData(rootData?: WithNull<PluginGameObjectData>): GameCollectionDefoldData {
  const name = resolveGameCollectionName(rootData)
  const defaults = injectGameCollectionDefaults();
  return {
    ...defaults,
    name,
  };
}

/**
 * Converts the base game object to a Defold-like data.
 * @param layer - The Figma layer to convert.
 * @param options - The export options.
 * @returns The converted game object data.
 */
export async function convertEmptyComponentData(layer: BoxLayer, options: GameObjectDataExportOptions): Promise<GameObjectData> {
  const context = generateContextData(layer);
  const defaults = injectEmptyComponentDefaults();
  const data = getPluginData(layer, "defoldGameObject");
  const id = convertGameObjectId(layer, context, options)
  const componentChildren = await convertEmptyComponentChildren(layer);
  const children = componentChildren?.children || undefined;
  const figmaChildren = componentChildren?.figma_children || undefined;
  const sizeMode = undefined;
  const transformations = convertEmptyComponentTransformations(layer, options, data);
  const parent = convertGameObjectParent(options);
  const specialProperties = convertGameObjectSpecialProperties(layer, "TYPE_EMPTY", options, data);
  return {
    ...defaults,
    ...data,
    id,
    children,
    figma_node_id: layer.id,
    figma_node_type: layer.type,
    figma_children: figmaChildren,
    ...specialProperties,
    ...parent,
    ...transformations,
    size_mode: sizeMode,
  };
}

/**
 * Converts the sprite game object to a Defold-like data.
 * @param layer - The Figma layer to convert.
 * @param options - The export options.
 * @returns The converted sprite component data.
 */
export async function convertSpriteComponentData(layer: BoxLayer | SliceLayer, options: GameObjectDataExportOptions): Promise<GameObjectData> {
  const context = generateContextData(layer);
  const defaults = injectSpriteComponentDefaults();
  const data = resolveGameObjectPluginData(layer);
  const id = convertGameObjectId(layer, context, options)
  const slice9 = convertSpriteComponentSlice9(layer);
  const type = "TYPE_SPRITE";
  const spriteImage = await inferSpriteComponentSprite(layer);
  const sizeMode = await convertSpriteComponentSizeMode(layer, spriteImage.image, data);
  const transformations = convertSpriteComponentTransformations(layer, options, data);
  const parent = convertGameObjectParent(options);
  const specialProperties = convertGameObjectSpecialProperties(layer, type, options, data);
  return {
    ...defaults,
    ...data,
    id,
    type,
    figma_node_id: layer.id,
    figma_node_type: layer.type,
    ...specialProperties,
    ...parent,
    ...transformations,
    ...spriteImage,
    slice9,
    size_mode: sizeMode,
  };
}

/**
 * Converts the label game object to a Defold-like data.
 * @param layer - The Figma layer to convert.
 * @param options - The export options.
 * @returns The converted label component data.
 */
export async function convertLabelComponentData(layer: TextLayer, options: GameObjectDataExportOptions): Promise<GameObjectData> {
  const context = generateContextData(layer);
  const defaults = injectLabelComponentDefaults();
  const data = getPluginData(layer, "defoldGameObject");
  const id = convertGameObjectId(layer, context, options)
  const type = "TYPE_LABEL";
  const pivot = inferTextPivot(layer);
  const visuals = convertTextVisuals(layer);
  const sizeMode = undefined;
  const transformations = convertLabelComponentTransformations(layer, options, data);
  const parent = convertGameObjectParent(options);
  const text = inferText(layer);
  const textParameters = convertTextParameters(layer);
  const specialProperties = convertGameObjectSpecialProperties(layer, type, options, data);
  return {
    ...defaults,
    ...data,
    id,
    type,
    text,
    figma_node_id: layer.id,
    figma_node_type: layer.type,
    ...specialProperties,
    ...parent,
    ...transformations,
    ...visuals,
    ...textParameters,
    pivot,
    size_mode: sizeMode,
  };
}

/**
 * Converts the game object children to a Defold-like data.
 * @param layer - The Figma layer whose children to convert.
 * @returns The converted game object children data.
 */
async function convertEmptyComponentChildren(layer: BoxLayer) {
  if (hasChildren(layer)) {
    const children: string[] = []
    const figmaChildren: string[] = []
    for (const child of layer.children) {
      if ((isFigmaBox(child) && !isSlice9PlaceholderLayer(child) && !isFigmaSlice(child)) || isFigmaText(child)) {
        const type = await inferGameObjectType(child);
        const childData = resolveGameObjectPluginData(child);
        if (isGameObjectEmptyType(type)) {
          if (!childData || !isLayerSkippable(child, childData)) {
            children.push(child.name);
            figmaChildren.push(child.id);
          }
        }
      }
    }
    if (children.length > 0) {
      return { children, figma_children: figmaChildren };
    }
  }
  return undefined;
}

/**
 * Converts the game object parent to a Defold-like data.
 * @param parentId - The parent ID.
 * @returns The converted game object parent data.
 */
function convertGameObjectParent(options: GameObjectDataExportOptions) {
  const { parentId } = options
  return parentId ? { parent: parentId } : {};
}

/**
 * Converts the game object ID to a Defold-like data.
 * @param layer - The Figma layer to convert.
 * @param context
 * @param options
 * @returns The converted game object ID.
 */
function convertGameObjectId(layer: ExportableLayer, context: PluginContextData, options: GameObjectDataExportOptions) {
  const { ignorePrefixes } = context
  const { forcedName, namePrefix } = options
  const name = forcedName || layer.name;
  if (!ignorePrefixes) {
    return `${namePrefix || ""}${name}`;
  }
  return name;
}

/**
 * Resolves the implied game object.
 * @param type - The game object type.
 * @param options - The export options.
 * @returns Whether the Figma layer has an implied game object.
 */
function resolveImpliedGameObject(type: GameObjectType, options: GameObjectDataExportOptions): boolean {
  if (isGameObjectEmptyType(type)) {
    return false;
  }
  return options.atRoot;
}

/**
 * Converts the base game object transformations to a Defold-like data.
 * @param layer - The Figma layer to convert.
 * @param parentSize - The parent size.
 * @param arrangeDepth - Whether to arrange depth.
 * @param depthAxis - The depth axis.
 * @param data - The plugin data.
 * @returns The converted base game object transformations data.
 */
function convertEmptyComponentTransformations(layer: BoxLayer, options: GameObjectDataExportOptions, data?: WithNull<PluginGameObjectData>) {
  const gameObjectTransformations = convertGameObjectTransformations(layer);
  const size = inferSize(layer);
  const position = convertGameObjectPosition(layer, size, options, data);
  const scale = inferScale(layer);
  return {
    ...gameObjectTransformations,
    position,
    scale,
  };
}

/**
 * Converts the label game object transformations to a `Defold-like data.
 * @param layer - The Figma layer to convert.
 * @param parentSize - The parent size.
 * @param arrangeDepth - Whether to arrange depth.
 * @param depthAxis - The depth axis.
 * @param data - The plugin data.
 * @returns The converted label game object transformations data.
 */
function convertLabelComponentTransformations(layer: TextLayer, options: GameObjectDataExportOptions, data?: WithNull<PluginGameObjectData>) {
  const gameObjectTransformations = convertGameObjectTransformations(layer);
  const textBoxSize = inferSize(layer);
  const scale = inferTextScale(layer);
  const size = inferTextBoxSize(layer, scale);
  const position = convertLabelComponentPosition(layer, textBoxSize, options, data);
  return {
    ...gameObjectTransformations,
    position,
    size,
    scale,
  };
}

/**
 * Converts the sprite game object transformations to a Defold-like data.
 * @param layer - The Figma layer to convert.
 * @param parentSize - The parent size.
 * @param arrangeDepth - Whether to arrange depth.
 * @param depthAxis - The depth axis.
 * @param data - The plugin data.
 * @returns The converted sprite game object transformations data.
 */
function convertSpriteComponentTransformations(layer: ExportableLayer, options: GameObjectDataExportOptions, data?: WithNull<PluginGameObjectData>) {
  const gameObjectTransformations = convertGameObjectTransformations(layer);
  const size = inferSize(layer);
  const position = convertGameObjectPosition(layer, size, options, data);
  const scale = inferScale(layer);
  return {
    ...gameObjectTransformations,
    position,
    size,
    scale,
  };
}

/**
 * Converts the game object transformations to a Defold-like data.
 * @param layer - The Figma layer to convert.
 * @returns The converted game object transformations data.
 */
function convertGameObjectTransformations(layer: ExportableLayer) {
  const rotation = inferRotation(layer);
  const figmaPosition = inferFigmaPosition(layer)
  const figmaSize = inferFigmaSize(layer);
  return {
    rotation,
    figma_position: figmaPosition,
    figma_size: figmaSize,
  };
}

/**
 * Converts the game object position to a Defold-like data.
 * @param layer - The Figma layer to convert.
 * @param size - The size of the game object.
 * @param parentSize - The parent size.
 * @param arrangeDepth - Whether to arrange depth.
 * @param depthAxis - The depth axis.
 * @param data - The plugin data.
 * @returns The converted game object position.
 */
function convertGameObjectPosition(layer: ExportableLayer, size: Vector4, options: GameObjectDataExportOptions, data?: WithNull<PluginGameObjectData>) {
  const { parentShift, atRoot } = options
  const { parent } = layer;
  if (atRoot && (!parent || (isFigmaPage(parent) || isFigmaSection(parent)))) {
    return vector4(0);
  }
  const { x, y } = layer;
  const centeredPosition = calculateCenteredPosition(layer, size, options);
  const shiftedPosition = addPositionParentShift(centeredPosition, parentShift);
  const resolvedZ = resolveGameObjectZCoordinate(data);
  const resolvedDepthLayer = resolveGameObjectDepthLayer(data);
  const resolvedIndex = resolveFigmaLayerIndex(layer);
  const depth = calculateGameObjectDepth(x, y, resolvedZ, resolvedDepthLayer, resolvedIndex, options);
  shiftedPosition.z = resolvedZ + depth;
  const readablePosition = readableVector(shiftedPosition);
  return readablePosition;
}

/**
 * Converts the label game object position to a Defold-like data.
 * @param layer - The Figma layer to convert.
 * @param size - The size of the game object.
 * @param parentSize - The parent size.
 * @param parentShift - The parent shift.
 * @param arrangeDepth - Whether to arrange depth.
 * @param depthAxis - The depth axis.
 * @param data - The plugin data.
 * @returns The converted label game object position.
 */
function convertLabelComponentPosition(layer: ExportableLayer, size: Vector4, options: GameObjectDataExportOptions, data?: WithNull<PluginGameObjectData>) {
  const { parentShift, atRoot } = options
  const { parent } = layer;
  if (atRoot && (!parent || (isFigmaPage(parent) || isFigmaSection(parent)))) {
    return vector4(0);
  }
  const { x, y } = layer;
  const centeredPosition = calculateCenteredPosition(layer, size, options);
  const pivotedPosition = convertCenteredPositionToPivotedPosition(centeredPosition, options);
  const shiftedPosition = addPositionParentShift(pivotedPosition, parentShift);
  const resolvedZ = resolveGameObjectZCoordinate(data);
  const resolvedDepthLayer = resolveGameObjectDepthLayer(data);
  const resolvedIndex = resolveFigmaLayerIndex(layer);
  const depth = calculateGameObjectDepth(x, y, resolvedZ, resolvedDepthLayer, resolvedIndex, options);
  shiftedPosition.z = resolvedZ + depth;
  const readablePosition = readableVector(shiftedPosition);
  return readablePosition;
}

/**
 * Converts the sprite game object slice9 to a Defold-like data.
 * @param layer - The Figma layer to convert.
 * @param data - The plugin data. 
 * @returns The converted sprite game object slice9 data.
 */
function convertSpriteComponentSlice9(layer: BoxLayer | SliceLayer, data?: WithNull<PluginGameObjectData>) {
  if (isFigmaSlice(layer)) {
    return vector4(0)
  }
  return inferSlice9(layer, data)
}

/**
 * Converts the sprite game object size mode to a Defold-like data.
 * @param layer - The Figma layer to convert.
 * @param texture - The texture of the sprite.
 * @param pluginData - The plugin data. 
 * @returns The converted sprite game object size mode.
 */
async function convertSpriteComponentSizeMode(layer: ExportableLayer, texture?: string, pluginData?: WithNull<PluginGameObjectData>): Promise<SizeMode> {
  if (pluginData?.size_mode && Object.values(config.sizeModes).includes(pluginData.size_mode)) {
    return pluginData.size_mode;
  }
  return await inferSizeMode(layer);
}

/**
 * Converts label game object text visuals to a Defold-like data.
 * @param layer - The Figma layer to convert.
 * @returns The converted label game object text visuals.
 */
function convertTextVisuals(layer: TextLayer) {
  const color = inferColor(layer);
  const outline = inferTextOutline(layer);
  const shadow = inferTextShadow(layer);
  return {
    color,
    outline,
    shadow,
  };
}

/**
 * Converts label game object text parameters to a Defold-like data.
 * @param layer - The Figma layer to convert.
 * @returns The converted label game object text parameters.
 */
function convertTextParameters(layer: TextLayer) {
  const lineBreak = inferLineBreak(layer);
  const textLeading = inferTextLeading(layer);
  const textTracking = inferTextTracking(layer);
  return {
    line_break: lineBreak,
    text_leading: textLeading,
    text_tracking: textTracking,
  };
}

/**
 * Converts the game object special properties to a Defold-like data.
 * @param layer - The Figma layer to convert the special properties for.
 * @param type - The game object type.
 * @param options - The export options.
 * @param pluginData - The plugin data.
 * @returns The converted game object special properties data.
 */
function convertGameObjectSpecialProperties(layer: ExportableLayer, type: GameObjectType, options: GameObjectDataExportOptions, pluginData?: WithNull<PluginGameObjectData>) {
  const fallbackImpliedGameObject = resolveImpliedGameObject(type, options);
  return {
    skip: !!pluginData?.skip,
    path: pluginData?.path || config.gameObjectDefaultSpecialValues.path,
    exclude: !!pluginData?.exclude,
    inferred: !!pluginData?.inferred,
    implied_game_object: !!pluginData?.implied_game_object || fallbackImpliedGameObject,
    exportable_layer: layer,
    exportable_layer_id: layer.id,
    exportable_layer_name: layer.name,
  };
}
