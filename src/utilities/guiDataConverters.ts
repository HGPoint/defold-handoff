import config from "config/config.json";
import { findTexture } from "utilities/gui";
import { isFigmaText, hasSolidFills, hasSolidStrokes, isSolidPaint, isShadowEffect, getPluginData } from "utilities/figma";
import { isSlice9Layer, findPlaceholderLayer, parseSlice9Data } from "utilities/slice9";
import { isZeroVector, vector4 } from "utilities/math";
import { calculatePivotedPosition, calculateCenteredPosition, calculateRootPosition } from "utilities/pivot";
import { inferBoxSizeMode, inferTextSizeMode, inferBoxVisible, inferTextVisible, inferFont } from "utilities/inference";

function calculateId(layer: ExportableLayer, forcedName?: string, namePrefix?: string) {
  const name = forcedName || layer.name;
  if (namePrefix) {
    return `${namePrefix}${name}`;
  }
  return name;
}

function calculateColorValue(paint: SolidPaint) {
  const { color: { r, g, b, }, opacity: a } = paint;
  return vector4(r, g, b, a);
}

function calculateType(layer: ExportableLayer, data?: PluginGUINodeData | null, atRoot?: boolean): GUINodeType {
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

function convertChildPosition(layer: ExportableLayer, pivot: Pivot, parentPivot: Pivot, size: Vector4, parentSize: Vector4, parentShift: Vector4) {
  const centeredPosition = calculateCenteredPosition(layer, size, parentSize);
  const pivotedPosition = calculatePivotedPosition(centeredPosition, pivot, parentPivot, size, parentSize);
  const shiftedX = pivotedPosition.x + parentShift.x;
  const shiftedY = pivotedPosition.y - parentShift.y;
  const shiftedPosition = vector4(shiftedX, shiftedY, 0, 1);
  return shiftedPosition; 
}

function convertPosition(layer: ExportableLayer, pivot: Pivot, parentPivot: Pivot, size: Vector4, parentSize: Vector4, parentShift: Vector4, atRoot: boolean, data?: PluginGUINodeData | null) {
  if (atRoot) {
    return calculateRootPosition(layer, pivot, parentPivot, size, parentSize, parentShift, data);
  }
  return convertChildPosition(layer, pivot, parentPivot, size, parentSize, parentShift);
}

function convertFigmaPosition(layer: ExportableLayer) {
  return vector4(layer.x, layer.y, 0, 1);
}

function convertRotation(layer: ExportableLayer) {
  return vector4(0, 0, layer.rotation, 1);
}

function convertBoxScale() {
  return vector4(1);
}

function calculateMixedTextScale() {
  return vector4(1);
}

function calculateTextScale(fontSize: number) {
  const scale = fontSize / config.fontSize;
  return vector4(scale, scale, scale, 1);
}

function convertTextScale(layer: TextNode) {
  const { fontSize } = layer;
  if (typeof fontSize !== "number") {
    return calculateMixedTextScale();
  }
  return calculateTextScale(fontSize);
}

function convertBoxSize(layer: ExportableLayer) {
  if (isSlice9Layer(layer)) {
    const placeholder = findPlaceholderLayer(layer);
    if (placeholder) {
      return vector4(placeholder.width, placeholder.height, 0, 1);
    }
  } 
  return vector4(layer.width, layer.height, 0, 1);
}

function convertTextSize(layer: TextLayer, scale: Vector4) {
  const { width, height } = layer;
  const scaledWidth = width / scale.x;
  const scaledHeight = height / scale.y;
  return vector4(scaledWidth, scaledHeight, 0, 1);
}

function calculateBoxSizeMode(layer: BoxLayer, texture?: string, data?: PluginGUINodeData | null): SizeMode {
  if (data?.size_mode && data.size_mode !== "PARSED") {
    return data.size_mode;
  }
  return inferBoxSizeMode(layer, texture);
}

function calculateTextSizeMode(data?: PluginGUINodeData | null) {
  if (data?.size_mode && data.size_mode !== "PARSED") {
    return data.size_mode;
  }
  return inferTextSizeMode();
}

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

function calculateBoxPivot(data?: PluginGUINodeData | null) {
  const pivot = data?.pivot;
  if (pivot) {
    return pivot;
  }
  return config.guiNodeDefaultValues.pivot;
}

function calculateTextPivot(layer: TextLayer): Pivot {
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

function calculateBaseColor() {
  return vector4(1);
}

function calculateFillColor(fills: readonly Paint[] | typeof figma.mixed) {
  if (Array.isArray(fills)) {
    const fill: SolidPaint | undefined = fills.find(isSolidPaint);
    if (fill) {
      return calculateColorValue(fill);
    }
  }
  return calculateBaseOutline();
}

function calculateColor(layer: ExportableLayer) {
  const { fills } = layer;
  if (!hasSolidFills(fills)) {
    return calculateBaseColor();
  }
  return calculateFillColor(fills);
}

function calculateBoxVisible(layer: BoxLayer, texture?: string, data?: PluginGUINodeData | null) {
  if (data?.visible !== undefined) {
    return data.visible;
  }
  return inferBoxVisible(layer, texture);
}

function calculateTextVisible(layer: TextLayer, data?: PluginGUINodeData | null) {
  if (data?.visible !== undefined) {
    return data.visible;
  }
  return inferTextVisible();
}

async function convertBoxVisuals(layer: BoxLayer, data?: PluginGUINodeData | null) {
  const color = calculateColor(layer);
  const texture = await findTexture(layer);
  const visible = calculateBoxVisible(layer, texture, data);
  return {
    visible,
    color,
    texture
  };
}

function calculateFont(layer: TextLayer, data?: PluginGUINodeData | null) {
  if (data?.font !== undefined) {
    return data.font;
  }
  return inferFont(layer);
}

function calculateBaseOutline() {
  return vector4(1, 1, 1, 0);
}

function calculateOutlineColor(strokes: readonly Paint[]) {
  const stroke: SolidPaint | undefined = strokes.find(isSolidPaint);
  if (stroke) {
    return calculateColorValue(stroke);
  }
  return calculateBaseOutline();
}

function calculateOutline(layer: TextLayer) {
  const { strokes } = layer;
  if (hasSolidStrokes(strokes)) {
    return calculateOutlineColor(strokes);
  }
  return calculateBaseOutline();
}

function calculateBaseShadow() {
  return vector4(1, 1, 1, 0);
}

function calculateShadowColor(effect: DropShadowEffect) {
  const { color: { r, g, b, a } } = effect;
  return vector4(r, g, b, a);
}

function calculateShadow(layer: TextLayer) {
  const effect = layer.effects.find(isShadowEffect);
  if (effect) {
    return calculateShadowColor(effect);
  }
  return calculateBaseShadow();
}

function convertTextVisuals(layer: TextLayer, data?: PluginGUINodeData | null) {
  const color = calculateColor(layer);
  const visible = calculateTextVisible(layer, data);
  const font = calculateFont(layer, data);
  const outline = calculateOutline(layer);
  const shadow = calculateShadow(layer);
  return {
    visible,
    color,
    outline,
    shadow,
    font
  };
}

function calculateLineBreak(layer: TextLayer) {
  return layer.textAutoResize === "HEIGHT";
}

function calculateTextLeading(layer: TextLayer) {
  if (typeof layer.lineHeight === "number" && typeof layer.fontSize === "number") {
    return layer.lineHeight / layer.fontSize;
  }
  return 1;
}

function calculateTextTracking(layer: TextLayer) {
  if (typeof layer.letterSpacing == "number") {
    return layer.letterSpacing;
  }
  return 0
}

function calculateTextParameters(layer: TextLayer) {
  const lineBreak = calculateLineBreak(layer);
  const textLeading = calculateTextLeading(layer);
  const textTracking = calculateTextTracking(layer);
  return {
    line_break: lineBreak,
    text_leading: textLeading,
    text_tracking: textTracking,
  };
}

function calculateSlice9(layer: BoxLayer, data?: PluginGUINodeData | null) {
  const parsedSlice9 = parseSlice9Data(layer);
  if (parsedSlice9 && !isZeroVector(parsedSlice9)) {
    return parsedSlice9;
  }
  return data?.slice9 || vector4(0)
}

function injectGUINodeDefaults() {
  return {
    ...config.guiNodeDefaultValues,
  };
}

function calculateSpecialProperties(layer: ExportableLayer, id: string, data?: PluginGUINodeData | null) {
  return {
    screen: !!data?.screen,
    skip: !!data?.skip,
    cloneable: !!data?.cloneable,
    template: !!data?.template,
    template_path: data?.template_path || config.guiNodeDefaultSpecialValues.template_path,
    template_name: data?.template_name || id,
    wrapper: !!data?.wrapper,
    wrapper_padding: data?.wrapper_padding || vector4(0),
    exportable_layer: layer,
  };
}

export async function convertBoxGUINodeData(layer: BoxLayer, options: GUINodeDataExportOptions): Promise<GUINodeData> {
  const { namePrefix, forcedName, parentId, parentPivot, parentSize, parentShift, atRoot } = options;
  const defaults = injectGUINodeDefaults();
  const data = getPluginData(layer, "defoldGUINode");
  const id = calculateId(layer, forcedName, namePrefix)
  const slice9 = calculateSlice9(layer, data);
  const type = calculateType(layer, data, atRoot);
  const pivot = calculateBoxPivot(data);
  const visuals = await convertBoxVisuals(layer, data);
  const sizeMode = calculateBoxSizeMode(layer, visuals.texture, data);
  const transformations = convertBoxTransformations(layer, pivot, parentPivot, parentSize, parentShift, atRoot, data);
  const parent = convertParent(parentId, data);
  const specialProperties = calculateSpecialProperties(layer, id, data);
  return {
    ...defaults,
    ...data,
    id,
    type,
    ...specialProperties,
    ...parent,
    ...transformations,
    ...visuals,
    slice9,
    pivot,
    size_mode: sizeMode,
  };
}

export function convertTextGUINodeData(layer: TextLayer, options: GUINodeDataExportOptions): GUINodeData {
  const { namePrefix, forcedName, parentId, parentPivot, parentSize, parentShift, atRoot } = options;
  const defaults = injectGUINodeDefaults();
  const data = getPluginData(layer, "defoldGUINode");
  const id = calculateId(layer, forcedName, namePrefix)
  const type = calculateType(layer, data);
  const pivot = calculateTextPivot(layer);
  const visuals = convertTextVisuals(layer, data);
  const sizeMode = calculateTextSizeMode(data);
  const transformations = convertTextTransformations(layer, pivot, parentPivot, parentSize, parentShift, atRoot, data);
  const parent = convertParent(parentId);
  const text = layer.characters;
  const textParameters = calculateTextParameters(layer);
  const specialProperties = calculateSpecialProperties(layer, id, data);
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

function calculateGUIBackgroundColor() {
  return vector4(0);
}

function injectGUIDefaults() {
  return config.guiDefaultValues;
}

export function convertGUIData(): GUIComponentData {
  const backgroundColor = calculateGUIBackgroundColor();
  const defaults = injectGUIDefaults();
  return {
    ...defaults,
    background_color: backgroundColor,
  };
}