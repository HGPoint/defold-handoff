/**
 * Utility module for generating GUI data.
 * @packageDocumentation
 */

import config from "config/config.json";
import { getPluginData, hasChildren, isExportable, isFigmaSlice } from "utilities/figma";
import { vector4 } from "utilities/math";
import { inferSpriteComponentSprite } from "utilities/inference";
import { calculateCenteredPosition, calculatePivotedPositionInParent } from "utilities/pivot";
import { generateContextData } from "utilities/context";
import { isEmptyGameObjectType, resolvesGameObjectType } from "utilities/gameObject";
import { injectLabelComponentDefaultValues, injectSpriteComponentDefaultValues, injectEmptyComponentDefaultValues, inferScale, inferTextScale, inferRotation, inferTextBoxSize, inferSlice9, inferBoxSizeMode, inferTextPivot, inferText, inferColor, inferTextOutline, inferTextShadow, inferLineBreak, inferTextLeading, inferTextTracking, inferSize } from "utilities/inference";
import { isSlice9PlaceholderLayer } from "utilities/slice9";

function convertGameObjectId(layer: ExportableLayer, ignorePrefixes: boolean, forcedName?: string, namePrefix?: string) {
  const name = forcedName || layer.name;
  if (!ignorePrefixes) {
    return `${namePrefix || ""}${name}`;
  }
  return name;
}

async function convertEmptyComponentChildren(layer: BoxLayer) {
  if (hasChildren(layer)) {
    const children = []
    for (const child of layer.children) {
      if (isExportable(child)) {
        const type = await resolvesGameObjectType(child);
        if (!isSlice9PlaceholderLayer(child) && !isFigmaSlice(child) && isEmptyGameObjectType(type)) {
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

function convertGameObjectParent(parentId?: string) {
  return parentId ? { parent: parentId } : {};
}

function parseDepthAxis(depthAxis: string) {
  const xPosition = depthAxis.toLocaleLowerCase().indexOf("x");
  const yPosition = depthAxis.toLocaleLowerCase().indexOf("y");
  const indexStart = xPosition > yPosition ? xPosition : yPosition;
  const step = parseFloat(depthAxis.slice(indexStart + 1));
  const axis = `${xPosition !== -1 ? "x" : ""}${yPosition !== -1 ? "y" : ""}`;
  return { axis, step };
}

function calculateGameObjectDepth(x: number, y: number, z: number, arrangeDepth: boolean, depthAxis?: string) {
  if (arrangeDepth) {
    depthAxis = depthAxis || config.gameObjectDefaultSpecialValues.depth_axis;
    const { axis, step } = parseDepthAxis(depthAxis);
    if (axis.includes("x") && axis.includes("y")) {
      const distance = Math.sqrt(x * x + y * y);
      return distance * step;
    } else if (axis.includes("x")) {
      return x * step;
    } else if (axis.includes("y")) {
      return y * step;
    }
  }
  return z;
}

function calculateGameObjectPosition(layer: ExportableLayer, size: Vector4, parentSize: Vector4, arrangeDepth: boolean, depthAxis?: string) {
  const centeredPosition = calculateCenteredPosition(layer, size, parentSize);
  centeredPosition.z = calculateGameObjectDepth(layer.x, layer.y, 0, arrangeDepth, depthAxis);
  return centeredPosition;
}

function convertLabelComponentPosition(layer: ExportableLayer, size: Vector4, parentSize: Vector4, arrangeDepth: boolean, depthAxis?: string) {
  const centeredPosition = calculateCenteredPosition(layer, size, parentSize);
  const position = calculatePivotedPositionInParent(centeredPosition, "PIVOT_CENTER", parentSize);
  position.z = calculateGameObjectDepth(layer.x, layer.y, 0, arrangeDepth, depthAxis);
  return position;
}

async function convertSpriteComponentSizeMode(layer: ExportableLayer, texture?: string, data?: PluginGameObjectData | null): Promise<SizeMode> {
  if (data?.size_mode && data.size_mode !== "PARSED") {
    return data.size_mode;
  }
  return await inferBoxSizeMode(layer, texture);
}

function convertSpriteComponentSlice9(layer: BoxLayer | SliceLayer, data?: PluginGameObjectData | null) {
  if (isFigmaSlice(layer)) {
    return vector4(0)
  }
  return inferSlice9(layer, data)
}

function convertGameObjectTransformations(layer: ExportableLayer) {
  const figmaPosition = vector4(layer.x, layer.y, 0, 1);
  const rotation = inferRotation(layer);
  return {
    rotation,
    figma_position: figmaPosition,
  };
}

function convertLabelComponentTransformations(layer: TextLayer, parentSize: Vector4, arrangeDepth: boolean, depthAxis?: string) {
  const scale = inferTextScale(layer);
  const textBoxSize = inferSize(layer);
  const size = inferTextBoxSize(layer, scale);
  const position = convertLabelComponentPosition(layer, textBoxSize, parentSize, arrangeDepth, depthAxis);
  const gameObjectTransformations = convertGameObjectTransformations(layer);
  return {
    ...gameObjectTransformations,
    position,
    size,
    scale,
  };
}

function convertSpriteComponentTransformations(layer: ExportableLayer, parentSize: Vector4, arrangeDepth: boolean, depthAxis?: string) {
  const gameObjectTransformations = convertGameObjectTransformations(layer);
  const size = inferSize(layer);
  const position = calculateGameObjectPosition(layer, size, parentSize, arrangeDepth, depthAxis);
  const scale = inferScale();
  return {
    ...gameObjectTransformations,
    position,
    size,
    scale,
  };
}

function convertEmptyComponentTransformations(layer: BoxLayer, parentSize: Vector4, arrangeDepth: boolean, depthAxis?: string) {
  const gameObjectTransformations = convertGameObjectTransformations(layer);
  const size = inferSize(layer);
  const position = calculateGameObjectPosition(layer, size, parentSize, arrangeDepth, depthAxis);
  const scale = inferScale();
  return {
    ...gameObjectTransformations,
    position,
    scale,
  };
}

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

function convertImpliedGameObject(type: GameObjectType, options: GameObjectDataExportOptions): boolean {
  if (isEmptyGameObjectType(type)) {
    return false;
  }
  return options.atRoot;
}

function convertGameObjectSpecialProperties(layer: ExportableLayer, id: string, type: GameObjectType, options: GameObjectDataExportOptions, data?: PluginGameObjectData | null) {
  const fallbackImpliedGameObject = convertImpliedGameObject(type, options);
  return {
    skip: !!data?.skip,
    path: data?.path || config.gameObjectDefaultSpecialValues.path,
    exclude: !!data?.exclude,
    inferred: !!data?.inferred,
    implied_game_object: !!data?.implied_game_object || fallbackImpliedGameObject,
    exportable_layer: layer,
    exportable_layer_id: layer.id,
    exportable_layer_name: layer.name,
  };
}

export async function convertEmptyComponentData(layer: BoxLayer, options: GameObjectDataExportOptions): Promise<GameObjectData> {
  const { namePrefix, forcedName, parentId, parentSize, arrangeDepth, depthAxis } = options;
  const context = generateContextData(layer);
  const defaults = injectEmptyComponentDefaultValues();
  const data = getPluginData(layer, "defoldGameObject");
  const id = convertGameObjectId(layer, context.ignorePrefixes, forcedName, namePrefix)
  const children = await convertEmptyComponentChildren(layer);
  const sizeMode = undefined;
  const transformations = convertEmptyComponentTransformations(layer, parentSize, arrangeDepth, depthAxis);
  const parent = convertGameObjectParent(parentId);
  const specialProperties = convertGameObjectSpecialProperties(layer, id, "TYPE_EMPTY", options, data);
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

export async function convertSpriteComponentData(layer: BoxLayer | SliceLayer, options: GameObjectDataExportOptions): Promise<GameObjectData> {
  const { namePrefix, forcedName, parentId, parentSize, arrangeDepth, depthAxis } = options;
  const context = generateContextData(layer);
  const defaults = injectSpriteComponentDefaultValues();
  const data = getPluginData(layer, "defoldGameObject");
  const id = convertGameObjectId(layer, context.ignorePrefixes, forcedName, namePrefix)
  const slice9 = convertSpriteComponentSlice9(layer);
  const type = "TYPE_SPRITE";
  const spriteImage = await inferSpriteComponentSprite(layer);
  const sizeMode = await convertSpriteComponentSizeMode(layer, spriteImage.image, data);
  const transformations = convertSpriteComponentTransformations(layer, parentSize, arrangeDepth, depthAxis);
  const parent = convertGameObjectParent(parentId);
  const specialProperties = convertGameObjectSpecialProperties(layer, id, type, options, data);
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

export async function convertLabelComponentData(layer: TextLayer, options: GameObjectDataExportOptions): Promise<GameObjectData> {
  const { namePrefix, forcedName, parentId, parentSize, arrangeDepth, depthAxis } = options;
  const context = generateContextData(layer);
  const defaults = injectLabelComponentDefaultValues();
  const data = getPluginData(layer, "defoldGameObject");
  const id = convertGameObjectId(layer, context.ignorePrefixes, forcedName, namePrefix)
  const type = "TYPE_LABEL";
  const pivot = inferTextPivot(layer);
  const visuals = convertTextVisuals(layer);
  const sizeMode = undefined;
  const transformations = convertLabelComponentTransformations(layer, parentSize, arrangeDepth, depthAxis);
  const parent = convertGameObjectParent(parentId);
  const text = inferText(layer);
  const textParameters = convertTextParameters(layer);
  const specialProperties = convertGameObjectSpecialProperties(layer, id, type, options, data);
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

function convertGameCollectionName(data: PluginGameObjectData | null | undefined) {
  return data?.id ? data.id : config.gameCollectionDefaultValues.name;
}

function injectGameCollectionDefaults() {
  return {
    ...config.gameCollectionDefaultValues
  };
}

export function convertGameCollectionData(rootData: PluginGameObjectData | null | undefined): GameCollectionComponentData {
  const name = convertGameCollectionName(rootData)
  const defaults = injectGameCollectionDefaults();
  return {
    ...defaults,
    name,
  };
}