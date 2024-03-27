import config from "config/config.json";
import { isAtlas, isFigmaSceneNode, isFigmaText, isFigmaComponentInstance, hasSolidFills, hasSolidStrokes, isSolidPaint, isShadowEffect, findMainComponent, getPluginData } from "utilities/figma";
import { isSlice9Layer, findPlaceholderLayer, parseSlice9Data } from "utilities/slice9";
import { isZeroVector4, vector4 } from "utilities/math";
import { calculatePivotedPosition } from "utilities/pivot";

function calculateId(layer: ExportableLayer) {
  return layer.name;
}

function calculateColorValue(paint: SolidPaint) {
  const { color: { r, g, b, }, opacity: a } = paint;
  return vector4(r, g, b, a);
}

function calculateType(layer: ExportableLayer): GUINodeType {
  return isFigmaText(layer) ? "TYPE_TEXT" : "TYPE_BOX";
}

function convertParent(parentId?: string) {
  return parentId ? { parent: parentId } : {};
}

function convertRootPosition(layer: ExportableLayer, pivot: Pivot, parentPivot: Pivot, size: Vector4, parentSize: Vector4) {
  const position = vector4(layer.x, layer.y, 0, 1);
  const pivotedPosition = calculatePivotedPosition(position, pivot, parentPivot, size, parentSize); 
  return pivotedPosition;
}

function calculateCenteredPosition(layer: ExportableLayer, size: Vector4, parentSize: Vector4) {
  const x = layer.x + (size.x / 2) - (parentSize.x / 2);
  const y = (parentSize.y / 2) - layer.y - (size.y / 2);
  return vector4(x, y, 0, 1);
}

function convertChildPosition(layer: ExportableLayer, pivot: Pivot, parentPivot: Pivot, size: Vector4, parentSize: Vector4) {
  const centeredPosition = calculateCenteredPosition(layer, size, parentSize);
  const pivotedPosition = calculatePivotedPosition(centeredPosition, pivot, parentPivot, size, parentSize);
  return pivotedPosition;
}

function convertPosition(layer: ExportableLayer, pivot: Pivot, parentPivot: Pivot, size: Vector4, parentSize?: Vector4) {
  if (!parentSize) {
    return convertRootPosition(layer, pivot, parentPivot, size, size);
  }
  return convertChildPosition(layer, pivot, parentPivot, size, parentSize);
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

function calculateBoxSizeMode(layer: BoxLayer, texture?: string): SizeMode {
  if (isSlice9Layer(layer)) {
    return "SIZE_MODE_MANUAL";
  }
  return texture ? "SIZE_MODE_AUTO" : "SIZE_MODE_MANUAL";
}

function calculateTextSizeMode() {
  return "SIZE_MODE_MANUAL";
}

function convertBaseTransformations(layer: ExportableLayer, pivot: Pivot, parentPivot: Pivot, size: Vector4, parentSize?: Vector4) {
  const position = convertPosition(layer, pivot, parentPivot, size, parentSize);
  const rotation = convertRotation(layer);
  return {
    position,
    rotation,
  };

}

function convertBoxTransformations(layer: BoxLayer, pivot: Pivot, parentPivot: Pivot, parentSize?: Vector4) {
  const size = convertBoxSize(layer);
  const baseTransformations = convertBaseTransformations(layer, pivot, parentPivot, size, parentSize);
  const scale = convertBoxScale();
  return {
    ...baseTransformations,
    size,
    scale,
  };
}

function convertTextTransformations(layer: TextLayer, pivot: Pivot, parentPivot: Pivot, parentSize?: Vector4) {
  const scale = convertTextScale(layer);
  const size = convertTextSize(layer, scale);
  const textBoxSize = convertBoxSize(layer);
  const baseTransformations = convertBaseTransformations(layer, pivot, parentPivot, textBoxSize, parentSize);
  return {
    ...baseTransformations,
    size,
    scale,
  };
}

function calculateBoxPivot(data: PluginGUINodeData | undefined | null) {
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

function calculateAtlasTexture(atlas: ComponentSetNode, layer: InstanceNode) {
  const texture = atlas.name;
  const sprite = layer.variantProperties?.Sprite;
  return sprite ? `${texture}/${sprite}` : "";
}

function calculateEmptyTexture() {
  return "";
}

async function calculateTexture(layer: ExportableLayer) {
  if (isFigmaComponentInstance(layer)) {
    const mainComponent = await findMainComponent(layer);
    if (mainComponent) {
      const { parent } = mainComponent;
      if (isFigmaSceneNode(parent) && isAtlas(parent)) {
        return calculateAtlasTexture(parent, layer);
      }
    }
  }
  return calculateEmptyTexture();
}

function calculateVisible(layer: ExportableLayer, texture?: string) {
  return !!texture || isFigmaText(layer);
}

async function convertBoxVisuals(layer: BoxLayer) {
  const color = calculateColor(layer);
  const texture = await calculateTexture(layer);
  const visible = calculateVisible(layer, texture);
  return {
    visible,
    color,
    texture
  };
}

function calculateFont() {
  return config.fontFamily;
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

function convertTextVisuals(layer: TextLayer) {
  const color = calculateColor(layer);
  const visible = calculateVisible(layer);
  const font = calculateFont();
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

function calculateSlice9(layer: BoxLayer, data: PluginGUINodeData | undefined | null) {
  const parsedSlice9 = parseSlice9Data(layer);
  if (parsedSlice9 && !isZeroVector4(parsedSlice9)) {
    return parsedSlice9;
  }
  return data?.slice9 || vector4(0)
}

function injectGUINodeDefaults() {
  return {
    ...config.guiNodeDefaultValues,
  };
}

export async function convertBoxGUINodeData(layer: BoxLayer, parentPivot: Pivot, parentId?: string, parentSize?: Vector4): Promise<GUINodeData> {
  const id = calculateId(layer)
  const defaults = injectGUINodeDefaults();
  const data = getPluginData(layer, "defoldGUINode");
  const slice9 = calculateSlice9(layer, data);
  const type = calculateType(layer);
  const pivot = calculateBoxPivot(data);
  const visuals = await convertBoxVisuals(layer);
  const sizeMode = calculateBoxSizeMode(layer, visuals.texture);
  const transformations = convertBoxTransformations(layer, pivot, parentPivot, parentSize);
  const parent = convertParent(parentId);
  return {
    ...defaults,
    ...data,
    id,
    type,
    ...parent,
    ...transformations,
    ...visuals,
    slice9,
    pivot,
    size_mode: sizeMode,
  };
}

export function convertTextGUINodeData(layer: TextLayer, parentPivot: Pivot, parentId?: string, parentSize?: Vector4): GUINodeData {
  const id = calculateId(layer)
  const defaults = injectGUINodeDefaults();
  const data = getPluginData(layer, "defoldGUINode");
  const type = calculateType(layer);
  const pivot = calculateTextPivot(layer);
  const visuals = convertTextVisuals(layer);
  const sizeMode = calculateTextSizeMode();
  const transformations = convertTextTransformations(layer, pivot, parentPivot, parentSize);
  const parent = convertParent(parentId);
  const text = layer.characters;
  const textParameters = calculateTextParameters(layer);
  return {
    ...defaults,
    ...data,
    id,
    type,
    text,
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