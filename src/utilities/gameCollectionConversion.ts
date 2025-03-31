/**
 * Handles game-related data conversion from Figma into Defold-like properties.
 * @packageDocumentation
 */

import config from "config/config.json";
import { generateContextData } from "utilities/context";
import { injectEmptyComponentDefaults, injectGameCollectionDefaults, injectLabelComponentDefaults, injectSpriteComponentDefaults } from "utilities/defaults";
import { getPluginData, hasChildren, isFigmaSlice, isLayerExportable } from "utilities/figma";
import { calculateGameObjectDepth, isGameObjectEmptyType, resolveGameCollectionName, resolveGameObjectPluginData, resolveGameObjectZPosition } from "utilities/gameCollection";
import { inferColor, inferGameObjectType, inferLineBreak, inferRotation, inferScale, inferSize, inferSizeMode, inferSlice9, inferSpriteComponentSprite, inferText, inferTextBoxSize, inferTextLeading, inferTextOutline, inferTextPivot, inferTextScale, inferTextShadow, inferTextTracking } from "utilities/inference";
import { vector4 } from "utilities/math";
import { convertPositionWithParentShift, calculateCenteredPosition, convertCenteredPositionToPivotedPosition } from "utilities/pivot";
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
  const { namePrefix, forcedName, parentId, parentSize, parentShift, atRoot, arrangeDepth, depthAxis } = options;
  const context = generateContextData(layer);
  const defaults = injectEmptyComponentDefaults();
  const data = getPluginData(layer, "defoldGameObject");
  const id = convertGameObjectId(layer, context.ignorePrefixes, forcedName, namePrefix)
  const children = await convertEmptyComponentChildren(layer);
  const sizeMode = undefined;
  const transformations = convertEmptyComponentTransformations(layer, parentSize, parentShift, atRoot, arrangeDepth, depthAxis, data);
  const parent = convertGameObjectParent(parentId);
  const specialProperties = convertGameObjectSpecialProperties(layer, "TYPE_EMPTY", options, data);
  return {
    ...defaults,
    ...data,
    id,
    children,
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
  const { namePrefix, forcedName, parentId, parentSize, parentShift, atRoot, arrangeDepth, depthAxis } = options;
  const context = generateContextData(layer);
  const defaults = injectSpriteComponentDefaults();
  const data = resolveGameObjectPluginData(layer);
  const id = convertGameObjectId(layer, context.ignorePrefixes, forcedName, namePrefix)
  const slice9 = convertSpriteComponentSlice9(layer);
  const type = "TYPE_SPRITE";
  const spriteImage = await inferSpriteComponentSprite(layer);
  const sizeMode = await convertSpriteComponentSizeMode(layer, spriteImage.image, data);
  const transformations = convertSpriteComponentTransformations(layer, parentSize, parentShift, atRoot, arrangeDepth, depthAxis, data);
  const parent = convertGameObjectParent(parentId);
  const specialProperties = convertGameObjectSpecialProperties(layer, type, options, data);
  return {
    ...defaults,
    ...data,
    id,
    type,
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
  const { namePrefix, forcedName, parentId, parentSize, parentShift, arrangeDepth, depthAxis } = options;
  const context = generateContextData(layer);
  const defaults = injectLabelComponentDefaults();
  const data = getPluginData(layer, "defoldGameObject");
  const id = convertGameObjectId(layer, context.ignorePrefixes, forcedName, namePrefix)
  const type = "TYPE_LABEL";
  const pivot = inferTextPivot(layer);
  const visuals = convertTextVisuals(layer);
  const sizeMode = undefined;
  const transformations = convertLabelComponentTransformations(layer, parentSize, parentShift, arrangeDepth, depthAxis, data);
  const parent = convertGameObjectParent(parentId);
  const text = inferText(layer);
  const textParameters = convertTextParameters(layer);
  const specialProperties = convertGameObjectSpecialProperties(layer, type, options, data);

  return {
    ...defaults,
    ...data,
    id,
    type,
    text,
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
    const children = []
    for (const child of layer.children) {
      if (isLayerExportable(child) && !isSlice9PlaceholderLayer(child) && !isFigmaSlice(child)) {
        const type = await inferGameObjectType(child);
        if (isGameObjectEmptyType(type)) {
          children.push(child.name);
        }
      }
    }
    if (children.length > 0) {
      return children;
    }
  }
  return undefined;
}

/**
 * Converts the game object parent to a Defold-like data.
 * @param parentId - The parent ID.
 * @returns The converted game object parent data.
 */
function convertGameObjectParent(parentId?: string) {
  return parentId ? { parent: parentId } : {};
}

/**
 * Converts the game object ID to a Defold-like data.
 * @param layer - The Figma layer to convert.
 * @param ignorePrefixes - Whether to ignore prefixes.
 * @param forcedName - The forced name.
 * @param namePrefix - The name prefix.
 * @returns The converted game object ID.
 */
function convertGameObjectId(layer: ExportableLayer, ignorePrefixes: boolean, forcedName?: string, namePrefix?: string) {
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
 * @param parentShift - The parent shift.
 * @param atRoot - Whether the layer is at the root level.
 * @param arrangeDepth - Whether to arrange depth.
 * @param depthAxis - The depth axis.
 * @param data - The plugin data.
 * @returns The converted base game object transformations data.
 */
function convertEmptyComponentTransformations(layer: BoxLayer, parentSize: Vector4, parentShift: Vector4, atRoot: boolean, arrangeDepth: boolean, depthAxis?: string, data?: WithNull<PluginGameObjectData>) {
  const gameObjectTransformations = convertGameObjectTransformations(layer);
  const size = inferSize(layer);
  const position = convertGameObjectPosition(layer, size, parentSize, parentShift, atRoot, arrangeDepth, depthAxis, data);
  const scale = inferScale();
  return {
    ...gameObjectTransformations,
    position,
    scale,
  };
}

/**
 * Converts the label game object transformations to a Defold-like data.
 * @param layer - The Figma layer to convert.
 * @param parentSize - The parent size.
 * @param parentShift - The parent shift.
 * @param arrangeDepth - Whether to arrange depth.
 * @param depthAxis - The depth axis.
 * @param data - The plugin data.
 * @returns The converted label game object transformations data.
 */
function convertLabelComponentTransformations(layer: TextLayer, parentSize: Vector4, parentShift: Vector4, arrangeDepth: boolean, depthAxis?: string, data?: WithNull<PluginGameObjectData>) {
  const gameObjectTransformations = convertGameObjectTransformations(layer);
  const textBoxSize = inferSize(layer);
  const scale = inferTextScale(layer);
  const size = inferTextBoxSize(layer, scale);

  const position = convertLabelComponentPosition(layer, textBoxSize, parentSize, parentShift, arrangeDepth, depthAxis, data);
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
 * @param parentShift - The parent shift.
 * @param atRoot - Whether the layer is at the root level.
 * @param arrangeDepth - Whether to arrange depth.
 * @param depthAxis - The depth axis.
 * @param data - The plugin data.
 * @returns The converted sprite game object transformations data.
 */
function convertSpriteComponentTransformations(layer: ExportableLayer, parentSize: Vector4, parentShift: Vector4, atRoot: boolean, arrangeDepth: boolean, depthAxis?: string, data?: WithNull<PluginGameObjectData>) {
  const gameObjectTransformations = convertGameObjectTransformations(layer);
  const size = inferSize(layer);
  const position = convertGameObjectPosition(layer, size, parentSize, parentShift, atRoot, arrangeDepth, depthAxis, data);
  const scale = inferScale();
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
  const figmaPosition = vector4(layer.x, layer.y, 0, 0);
  return {
    rotation,
    figma_position: figmaPosition,
  };
}

/**
 * Converts the game object position to a Defold-like data.
 * @param layer - The Figma layer to convert.
 * @param size - The size of the game object.
 * @param parentSize - The parent size.
 * @param parentShift - The parent shift.
 * @param atRoot - Whether the layer is at the root level.
 * @param arrangeDepth - Whether to arrange depth.
 * @param depthAxis - The depth axis.
 * @param data - The plugin data.
 * @returns The converted game object position.
 */
function convertGameObjectPosition(layer: ExportableLayer, size: Vector4, parentSize: Vector4, parentShift: Vector4, atRoot: boolean, arrangeDepth: boolean, depthAxis?: string, data?: WithNull<PluginGameObjectData>) {
  if (atRoot) {
    const zPosition = resolveGameObjectZPosition(data);
    const depth = calculateGameObjectDepth(layer.x, layer.y, arrangeDepth, depthAxis);
    return vector4(0, 0, zPosition + depth, 0);
  }

  const centeredPosition = calculateCenteredPosition(layer, size, parentSize);
  const shiftedPosition = convertPositionWithParentShift(centeredPosition, parentShift);
  shiftedPosition.z = resolveGameObjectZPosition(data);
  shiftedPosition.z += calculateGameObjectDepth(layer.x, layer.y, arrangeDepth, depthAxis);
  return shiftedPosition;
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
function convertLabelComponentPosition(layer: ExportableLayer, size: Vector4, parentSize: Vector4, parentShift: Vector4, arrangeDepth: boolean, depthAxis?: string, data?: WithNull<PluginGameObjectData>) {
  const centeredPosition = calculateCenteredPosition(layer, size, parentSize);
  const position = convertCenteredPositionToPivotedPosition(centeredPosition, "PIVOT_CENTER", parentSize);
  const shiftedPosition = convertPositionWithParentShift(position, parentShift);
  shiftedPosition.z = resolveGameObjectZPosition(data);
  shiftedPosition.z += calculateGameObjectDepth(layer.x, layer.y, arrangeDepth, depthAxis);

  return shiftedPosition;
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
 * @param data - The plugin data. 
 * @returns The converted sprite game object size mode.
 */
async function convertSpriteComponentSizeMode(layer: ExportableLayer, texture?: string, data?: WithNull<PluginGameObjectData>): Promise<SizeMode> {
  if (data?.size_mode && Object.values(config.sizeModes).includes(data.size_mode)) {
    return data.size_mode;
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
