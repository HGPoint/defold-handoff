/**
 * Utility module for handling GUI node data conversion.
 * @packageDocumentation
 */

import config from "config/config.json";
import { findTexture } from "utilities/gui";
import { isFigmaText, hasSolidFills, hasSolidStrokes, isSolidPaint, isShadowEffect, getPluginData } from "utilities/figma";
import { isSlice9Layer, findPlaceholderLayer, parseSlice9Data } from "utilities/slice9";
import { isZeroVector, vector4 } from "utilities/math";
import { calculatePivotedPosition, calculateCenteredPosition, calculateRootPosition } from "utilities/pivot";
import { projectConfig } from "handoff/project";
import { inferBoxSizeMode, inferTextSizeMode, inferBoxVisible, inferTextVisible, inferFont } from "utilities/inference";
import { generateContextData } from "utilities/context";

/**
 * Generates the ID for a given layer, optionally with a forced name and name prefix.
 * @param layer - The Figma layer for which to calculate the ID.
 * @param forcedName - A forced name for the ID.
 * @param namePrefix - A prefix to prepend to the ID.
 * @returns The generated ID for the layer.
 */
function resolveId(layer: ExportableLayer, forcedName?: string, namePrefix?: string) {
  const name = forcedName || layer.name;
  if (namePrefix) {
    return `${namePrefix}${name}`;
  }
  return name;
}

/**
 * Calculates the RGBA color value for a given solid paint.
 * @param paint - The solid paint to calculate the color value for.
 * @returns The RGBA color value.
 */
function calculateColorValue(paint: SolidPaint) {
  const { color: { r, g, b, }, opacity: a } = paint;
  return vector4(r, g, b, a);
}

/**
 * Resolves type for a given layer based on its type and plugin data.
 * @param layer - The Figma layer to calculate the type for.
 * @param data - The plugin data associated with the layer.
 * @param atRoot - Indicates whether the layer is at the root level.
 * @returns The resolved type for the layer.
 */
function resolveType(layer: ExportableLayer, data?: PluginGUINodeData | null, atRoot?: boolean): GUINodeType {
  if (data?.template && !atRoot) {
    return "TYPE_TEMPLATE";
  }
  return isFigmaText(layer) ? "TYPE_TEXT" : "TYPE_BOX";
}

function convertParent(parentId?: string, data?: PluginGUINodeData | null) {
  if (data?.cloneable) {
    return {};
  }
  return parentId ? { parent: parentId } : {};
}

/**
 * Converts the position of a child layer relative to its parent.
 * @param layer - The ExportableLayer to convert position for.
 * @param pivot - The pivot point of the child layer.
 * @param parentPivot - The pivot point of the parent layer.
 * @param size - The size of the child layer.
 * @param parentSize - The size of the parent layer.
 * @param parentShift - The shift vector of the parent layer.
 * @returns The converted position vector of the child layer.
 */
function convertChildPosition(layer: ExportableLayer, pivot: Pivot, parentPivot: Pivot, size: Vector4, parentSize: Vector4, parentShift: Vector4) {
  const centeredPosition = calculateCenteredPosition(layer, size, parentSize);
  const pivotedPosition = calculatePivotedPosition(centeredPosition, pivot, parentPivot, size, parentSize);
  const shiftedX = pivotedPosition.x + parentShift.x;
  const shiftedY = pivotedPosition.y - parentShift.y;
  const shiftedPosition = vector4(shiftedX, shiftedY, 0, 1);
  return shiftedPosition; 
}

/**
 * Converts the position of a layer relative to its parent or to the root.
 * @param layer - The layer to convert position for.
 * @param pivot - The pivot point of the layer.
 * @param parentPivot - The pivot point of the parent layer.
 * @param size - The size of the layer.
 * @param parentSize - The size of the parent layer.
 * @param parentShift - The position shift of the parent layer.
 * @param atRoot - Indicates if the layer is at the root level.
 * @param data - GUI node data.
 * @returns The converted position vector of the layer.
 */
function convertPosition(layer: ExportableLayer, pivot: Pivot, parentPivot: Pivot, size: Vector4, parentSize: Vector4, parentShift: Vector4, atRoot: boolean, data?: PluginGUINodeData | null) {
  if (atRoot) {
    return calculateRootPosition(layer, pivot, parentPivot, size, parentSize, parentShift, data);
  }
  return convertChildPosition(layer, pivot, parentPivot, size, parentSize, parentShift);
}

/**
 * Converts the position of a layer from Figma coordinates to vector4 format.
 * @param layer - The Figma layer to convert position for.
 * @returns The converted position vector of the layer.
 */
function convertFigmaPosition(layer: ExportableLayer) {
  return vector4(layer.x, layer.y, 0, 1);
}

/**
 * Converts the rotation of a layer into a vector4 format.
 * @param layer - The Figma layer to convert rotation for.
 * @returns The converted rotation vector of the layer.
 */
function convertRotation(layer: ExportableLayer) {
  return vector4(0, 0, layer.rotation, 1);
}

/**
 * Converts the box scale of a layer into a vector4 format.
 * @returns The converted box scale vector.
 */
function convertBoxScale() {
  return vector4(1);
}

/**
 * Calculates the mixed text scale based on the font size.
 * @returns The calculated mixed text scale vector.
 */
function calculateMixedTextScale() {
  return vector4(1);
}

/**
 * Calculates the text scale based on the font size and the default font size.
 * @param fontSize - The font size of the text layer.
 * @returns The calculated text scale vector.
 */
function calculateTextScale(fontSize: number) {
  const scale = fontSize / config.fontSize;
  return vector4(scale, scale, scale, 1);
}

/**
 * Converts the text scale of a text layer into a vector4 format.
 * @param layer - The text layer to convert text scale for.
 * @returns The converted text scale vector.
 */
function convertTextScale(layer: TextNode) {
  const { fontSize } = layer;
  if (typeof fontSize !== "number") {
    return calculateMixedTextScale();
  }
  return calculateTextScale(fontSize);
}

/**
 * Converts the size of a Figma layer into a vector4 format.
 * @param layer - The Figma layer to convert size for.
 * @returns The converted size vector of the box layer.
 */
function convertBoxSize(layer: ExportableLayer) {
  if (isSlice9Layer(layer)) {
    const placeholder = findPlaceholderLayer(layer);
    if (placeholder) {
      return vector4(placeholder.width, placeholder.height, 0, 1);
    }
  } 
  return vector4(layer.width, layer.height, 0, 1);
}

/**
 * Converts the size of a text layer into a vector4 format.
 * @param layer - The text layer to convert size for.
 * @param scale - The scale vector of the text layer.
 * @returns The converted size of the text layer.
 */
function convertTextSize(layer: TextLayer, scale: Vector4) {
  const { width, height } = layer;
  const scaledWidth = width / scale.x;
  const scaledHeight = height / scale.y;
  return vector4(scaledWidth, scaledHeight, 0, 1);
}

/**
 * Resolves the size mode for a Figma layer.
 * @param layer - The Figma layer to calculate size mode for.
 * @param texture - The texture associated with the layer.
 * @param data - GUI node data.
 * @returns The calculated size mode for the Figma layer.
 */
async function resolveBoxSizeMode(layer: BoxLayer, texture?: string, data?: PluginGUINodeData | null): Promise<SizeMode> {
  if (data?.size_mode && data.size_mode !== "PARSED") {
    return data.size_mode;
  }
  return await inferBoxSizeMode(layer, texture);
}

/**
 * Calculates the size mode for a text layer.
 * @param data - GUI node data.
 * @returns The calculated size mode for the text layer.
 */
function resolveTextSizeMode(data?: PluginGUINodeData | null) {
  if (data?.size_mode && data.size_mode !== "PARSED") {
    return data.size_mode;
  }
  return inferTextSizeMode();
}

/**
 * Converts the base transformations of a layer into vector4 format.
 * @param layer - The Figma layer to convert base transformations for.
 * @param pivot - The pivot point of the layer.
 * @param parentPivot - The pivot point of the parent layer.
 * @param size - The size of the layer.
 * @param parentSize - The size of the parent layer.
 * @param parentShift - The shift of the parent layer.
 * @param atRoot - Indicates if the layer is at the root level.
 * @param data - GUI node data.
 * @returns The converted base transformations of the layer.
 */
function convertBaseTransformations(layer: ExportableLayer, pivot: Pivot, parentPivot: Pivot, size: Vector4, parentSize: Vector4, parentShift: Vector4, atRoot: boolean, data?: PluginGUINodeData | null) {
  const figmaPosition = convertFigmaPosition(layer);
  const position = convertPosition(layer, pivot, parentPivot, size, parentSize, parentShift, atRoot, data);
  const rotation = convertRotation(layer);
  return {
    position,
    rotation,
    figma_position: figmaPosition,
  };

}

/**
 * Converts the transformations of a Figma layer into vector4 format.
 * @param layer - The Figma layer to convert transformations for.
 * @param pivot - The pivot point of the layer.
 * @param parentPivot - The pivot point of the parent layer.
 * @param parentSize - The size of the parent layer.
 * @param parentShift - The shift of the parent layer.
 * @param atRoot - Indicates if the layer is at the root level.
 * @param data - GUI node data.
 * @returns The converted transformations of the Figma layer.
 */
function convertBoxTransformations(layer: BoxLayer, pivot: Pivot, parentPivot: Pivot, parentSize: Vector4, parentShift: Vector4, atRoot: boolean, data?: PluginGUINodeData | null) {
  const size = convertBoxSize(layer);
  const baseTransformations = convertBaseTransformations(layer, pivot, parentPivot, size, parentSize, parentShift, atRoot, data);
  const scale = convertBoxScale();
  return {
    ...baseTransformations,
    size,
    scale,
  };
}

/**
 * Converts the transformations of a text layer into vector4 format.
 * @param layer - The text layer to convert transformations for.
 * @param pivot - The pivot point of the layer.
 * @param parentPivot - The pivot point of the parent layer.
 * @param parentSize - The size of the parent layer.
 * @param parentShift - The shift vector of the parent layer.
 * @param atRoot - Indicates if the layer is at the root level.
 * @param data - GUI node data.
 * @returns The converted transformations of the text layer.
 */
function convertTextTransformations(layer: TextLayer, pivot: Pivot, parentPivot: Pivot, parentSize: Vector4, parentShift: Vector4, atRoot: boolean, data?: PluginGUINodeData | null) {
  const scale = convertTextScale(layer);
  const size = convertTextSize(layer, scale);
  const textBoxSize = convertBoxSize(layer);
  const baseTransformations = convertBaseTransformations(layer, pivot, parentPivot, textBoxSize, parentSize, parentShift, atRoot, data);
  return {
    ...baseTransformations,
    size,
    scale,
  };
}

/**
 * Resolve the pivot point for a Figma layer.
 * @param data - GUI node data.
 * @returns The resolved pivot point for the Figma layer.
 */
function resolveBoxPivot(data?: PluginGUINodeData | null) {
  const pivot = data?.pivot;
  if (pivot) {
    return pivot;
  }
  return config.guiNodeDefaultValues.pivot;
}

/**
 * Resolve the pivot point for a text layer.
 * @param layer - The text layer to calculate pivot point for.
 * @returns The resolved pivot point for the text layer.
 */
function resolveTextPivot(layer: TextLayer): Pivot {
  const alignVertical = layer.textAlignVertical;
  const alignHorizontal = layer.textAlignHorizontal;
  if (alignVertical === "TOP" && alignHorizontal === "LEFT") {
    return "PIVOT_NW";
  } else if (alignVertical === "TOP" && alignHorizontal === "CENTER") {
    return "PIVOT_N";
  } else if (alignVertical === "TOP" && alignHorizontal === "RIGHT") {
    return "PIVOT_NE";
  } else if (alignVertical === "CENTER" && alignHorizontal === "RIGHT") {
    return "PIVOT_E";
  } else if (alignVertical === "BOTTOM" && alignHorizontal === "RIGHT") {
    return "PIVOT_SE";
  } else if (alignVertical === "BOTTOM" && alignHorizontal === "CENTER") {
    return "PIVOT_S";
  } else if (alignVertical === "BOTTOM" && alignHorizontal === "LEFT") {
    return "PIVOT_SW";
  } else if (alignVertical === "CENTER" && alignHorizontal === "LEFT") {
    return "PIVOT_W";
  }
  return "PIVOT_CENTER";
}

/**
 * Resolve the base color for a layer.
 * @returns The resolved base color.
 */
function resolveBaseColor() {
  return vector4(1);
}

/**
 * Resolve the fill color for a layer.
 * @param fills - The array of paint fills applied to the layer.
 * @returns The resolved fill color vector.
 * TODO: Write a separate function for resolving a transparent fill color (use instead of calculateBaseOutline)
 */
function resolveFillColor(fills: readonly Paint[] | typeof figma.mixed) {
  if (Array.isArray(fills)) {
    const fill: SolidPaint | undefined = fills.find(isSolidPaint);
    if (fill) {
      return calculateColorValue(fill);
    }
  }
  return resolveBaseOutline();
}

/**
 * Resolve the color for a layer.
 * @param layer - The layer to calculate color for.
 * @returns The resolved color vector.
 */
function resolveColor(layer: ExportableLayer) {
  const { fills } = layer;
  if (!hasSolidFills(fills)) {
    return resolveBaseColor();
  }
  return resolveFillColor(fills);
}

/**
 * Resolves the visibility of a Figma layer.
 * @param layer - The Figma layer to calculate visibility for.
 * @param texture - The texture associated with the layer.
 * @param data - GUI node data.
 * @returns The resolved visibility for the Figma layer.
 */
function resolveBoxVisible(layer: BoxLayer, texture?: string, data?: PluginGUINodeData | null) {
  if (data?.visible !== undefined) {
    return data.visible;
  }
  return inferBoxVisible(layer, texture);
}

/**
 * Resolves the visibility of a text layer.
 * @param layer - The text layer to calculate visibility for.
 * @param data - GUI node data.
 * @returns The resolved visibility for the text layer.
 */
function resolveTextVisible(layer: TextLayer, data?: PluginGUINodeData | null) {
  if (data?.visible !== undefined) {
    return data.visible;
  }
  return inferTextVisible();
}

/**
 * Converts the visual properties of a Figma layer.
 * @param layer - The Figma layer to convert visual properties for.
 * @param data - GUI node data.
 * @returns The converted visual properties of the Figma layer.
 */
async function convertBoxVisuals(layer: BoxLayer, data?: PluginGUINodeData | null) {
  const color = resolveColor(layer);
  const texture = await findTexture(layer);
  const visible = resolveBoxVisible(layer, texture, data);
  return {
    visible,
    color,
    texture
  };
}

/**
 * Resolves the font for a text layer.
 * @param layer - The text layer to calculate font for.
 * @param data - PluginGUINodeData object containing additional data.
 * @returns The resolved font for the text layer.
 */
function resolveFont(layer: TextLayer, data?: PluginGUINodeData | null) {
  if (data?.font) {
    const fontData = projectConfig.fontFamilies.find(fontFamily => fontFamily.id === data.font);
    if (fontData) {
      return fontData.name;
    }
  }
  const inferredFont = inferFont(layer);
  if (inferredFont) {
    const inferredFontData = projectConfig.fontFamilies.find(fontFamily => fontFamily.id === inferredFont);
    if (inferredFontData) {
      return inferredFontData.name;
    }
  }
  return "";
}

/**
 * Resolves the base outline color.
 * @returns The resolved base outline color.
 */
function resolveBaseOutline() {
  return vector4(1, 1, 1, 0);
}

/**
 * Resolves the outline color for a text layer.
 * @param strokes - The array of strokes applied to the layer.
 * @returns The resolved outline color.
 */
function resolveOutlineColor(strokes: readonly Paint[]) {
  const stroke: SolidPaint | undefined = strokes.find(isSolidPaint);
  if (stroke) {
    return calculateColorValue(stroke);
  }
  return resolveBaseOutline();
}

/**
 * Resolves the outline for a text layer.
 * @param layer - The text layer to calculate outline for.
 * @returns The resolved outline.
 */
function calculateOutline(layer: TextLayer) {
  const { strokes } = layer;
  if (hasSolidStrokes(strokes)) {
    return resolveOutlineColor(strokes);
  }
  return resolveBaseOutline();
}

/**
 * Resolves the base shadow.
 * @returns The resolved base shadow.
 */
function resolveBaseShadow() {
  return vector4(1, 1, 1, 0);
}

/**
 * Resolves the shadow for a text layer.
 * @param effect - The drop shadow effect applied to the layer.
 * @returns The resolved shadow.
 */
function resolveShadowColor(effect: DropShadowEffect) {
  const { color: { r, g, b, a } } = effect;
  return vector4(r, g, b, a);
}

/**
 * Resolves the shadow for a text layer.
 * @param layer - The text layer to resolve a shadow for.
 * @returns The resolved shadow.
 */
function resolveShadow(layer: TextLayer) {
  const effect = layer.effects.find(isShadowEffect);
  if (effect) {
    return resolveShadowColor(effect);
  }
  return resolveBaseShadow();
}

/**
 * Converts the visual properties of a text layer.
 * @param layer - The text layer to convert visual properties for.
 * @param data - GUI node data.
 * @returns The converted visual properties of the text layer.
 */
function convertTextVisuals(layer: TextLayer, data?: PluginGUINodeData | null) {
  const color = resolveColor(layer);
  const visible = resolveTextVisible(layer, data);
  const font = resolveFont(layer, data);
  const outline = calculateOutline(layer);
  const shadow = resolveShadow(layer);
  return {
    visible,
    color,
    outline,
    shadow,
    font
  };
}

/**
 * Resolves whether the text has line breaks.
 * @param layer - The text layer to resolve line break for.
 * @returns True if the text has line breaks, otherwise false.
 */
function calculateLineBreak(layer: TextLayer) {
  return layer.textAutoResize === "HEIGHT";
}

/**
 * Calculates the leading (line height) of the text.
 * @param layer - The text layer to calculate leading for.
 * @returns The calculated text leading.
 */
function calculateTextLeading(layer: TextLayer) {
  if (typeof layer.lineHeight === "number" && typeof layer.fontSize === "number") {
    return layer.lineHeight / layer.fontSize;
  }
  return 1;
}

/**
 * Calculates the tracking (letter spacing) of the text.
 * @param layer - The text layer to calculate tracking for.
 * @returns The calculated text tracking.
 */
function calculateTextTracking(layer: TextLayer) {
  if (typeof layer.letterSpacing == "number") {
    return layer.letterSpacing;
  }
  return 0
}

/**
 * Calculates properties related to text layout.
 * @param layer - The text layer to calculate properties for.
 * @returns Calculated text properties of the text layer.
 */
function resolveTextParameters(layer: TextLayer) {
  const lineBreak = calculateLineBreak(layer);
  const textLeading = calculateTextLeading(layer);
  const textTracking = calculateTextTracking(layer);
  return {
    line_break: lineBreak,
    text_leading: textLeading,
    text_tracking: textTracking,
  };
}

/**
 * Resolves the slice9 data for a Figma layer.
 * @param layer - The Figma layer to resolve slice9 data for.
 * @param data - GUI node data.
 * @returns The resolved slice9 data for the Figma layer.
 */
function resolveSlice9(layer: BoxLayer, data?: PluginGUINodeData | null) {
  const parsedSlice9 = parseSlice9Data(layer);
  if (parsedSlice9 && !isZeroVector(parsedSlice9)) {
    return parsedSlice9;
  }
  return data?.slice9 || vector4(0)
}

/**
 * Injects default GUI node values.
 * @returns Default GUI node values.
 */
function injectGUINodeDefaults() {
  return {
    ...config.guiNodeDefaultValues,
  };
}

/**
 * Resolves special properties of a layer.
 * @param layer - The layer to calculate special properties for.
 * @param id - The ID of the layer.
 * @param data - GUI node data.
 * @returns Special properties of the layer.
 */
function resolveSpecialProperties(layer: ExportableLayer, id: string, data?: PluginGUINodeData | null) {
  return {
    screen: !!data?.screen,
    skip: !!data?.skip,
    cloneable: !!data?.cloneable,
    template: !!data?.template,
    template_path: data?.template_path || config.guiNodeDefaultSpecialValues.template_path,
    template_name: data?.template_name || id,
    wrapper: !!data?.wrapper,
    wrapper_padding: data?.wrapper_padding || vector4(0),
    exclude: !!data?.exclude,
    exportable_layer: layer,
  };
}

/**
 * Resolves the layer for a GUI node.
 * @param context - The GUI context data.
 * @param data - The GUI node data.
 * @returns The resolved layer for the GUI node.
 */
function resolveLayer(context: PluginGUIContextData, data?: PluginGUINodeData | null) {
  if (data?.layer) {
    if (data.layer.toUpperCase() === "DEFAULT") {
      return "";
    }
    const layerData = context.layers.find(guiLayer => guiLayer.id === data.layer);
    if (layerData) {
      return layerData.name;
    }
  }
  return "";
}

/**
 * Converts a Figma layer into GUI node data.
 * @param layer - The Figma layer to convert into GUI node data.
 * @param options - Options for exporting GUI node data.
 * @returns Converted GUI node data.
 */
export async function convertBoxGUINodeData(layer: BoxLayer, options: GUINodeDataExportOptions): Promise<GUINodeData> {
  const { namePrefix, forcedName, parentId, parentPivot, parentSize, parentShift, atRoot } = options;
  const context = generateContextData(layer);
  const defaults = injectGUINodeDefaults();
  const data = getPluginData(layer, "defoldGUINode");
  const id = resolveId(layer, forcedName, namePrefix)
  const slice9 = resolveSlice9(layer, data);
  const type = resolveType(layer, data, atRoot);
  const guiLayer = resolveLayer(context, data);
  const pivot = resolveBoxPivot(data);
  const visuals = await convertBoxVisuals(layer, data);
  const sizeMode = await resolveBoxSizeMode(layer, visuals.texture, data);
  const transformations = convertBoxTransformations(layer, pivot, parentPivot, parentSize, parentShift, atRoot, data);
  const parent = convertParent(parentId, data);
  const specialProperties = resolveSpecialProperties(layer, id, data);
  return {
    ...defaults,
    ...data,
    id,
    type,
    layer: guiLayer,
    ...specialProperties,
    ...parent,
    ...transformations,
    ...visuals,
    slice9,
    pivot,
    size_mode: sizeMode,
  };
}

/**
 * Converts a text layer into GUI node data.
 * @param layer - The text layer to convert into GUI node data.
 * @param options - Options for exporting GUI node data.
 * @returns Converted GUI node data.
 */
export function convertTextGUINodeData(layer: TextLayer, options: GUINodeDataExportOptions): GUINodeData {
  const { namePrefix, forcedName, parentId, parentPivot, parentSize, parentShift, atRoot } = options;
  const context = generateContextData(layer);
  const defaults = injectGUINodeDefaults();
  const data = getPluginData(layer, "defoldGUINode");
  const id = resolveId(layer, forcedName, namePrefix)
  const type = resolveType(layer, data);
  const guiLayer = resolveLayer(context, data);
  const pivot = resolveTextPivot(layer);
  const visuals = convertTextVisuals(layer, data);
  const sizeMode = resolveTextSizeMode(data);
  const transformations = convertTextTransformations(layer, pivot, parentPivot, parentSize, parentShift, atRoot, data);
  const parent = convertParent(parentId);
  const text = layer.characters;
  const textParameters = resolveTextParameters(layer);
  const specialProperties = resolveSpecialProperties(layer, id, data);
  return {
    ...defaults,
    ...data,
    id,
    type,
    layer: guiLayer,
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
 * Resolves the background color for the GUI component.
 * @returns The resolved background color.
 */
function resolveGUIBackgroundColor() {
  return vector4(0);
}

/**
 * Injects default GUI component values.
 * @returns Default GUI component values.
 */
function injectGUIDefaults() {
  return config.guiDefaultValues;
}

/**
 * Converts GUI component data.
 * @returns Converted GUI component data.
 */
export function convertGUIData(): GUIComponentData {
  const backgroundColor = resolveGUIBackgroundColor();
  const defaults = injectGUIDefaults();
  return {
    ...defaults,
    background_color: backgroundColor,
  };
}