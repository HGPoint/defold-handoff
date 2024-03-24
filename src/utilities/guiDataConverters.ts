import config from "config/config.json";
import { isAtlas, isFigmaSceneNode, isFigmaText, isFigmaComponentInstance, hasSolidFills, hasSolidStrokes, isSolidPaint, isShadowEffect, findMainComponent, getPluginData } from "utilities/figma";
import { vector4 } from "utilities/math";

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

function calculatePivotedPosition(centeredPosition: Vector4, layer: ExportableLayer, pivot: Pivot) {
  const { x, y } = centeredPosition;
  const { width, height } = layer;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  if (pivot === "PIVOT_N") {
    return vector4(x, y + halfHeight, 0, 1);
  } else if (pivot === "PIVOT_NE") {
    return vector4(x - halfWidth, y + halfHeight, 0, 1);
  } else if (pivot === "PIVOT_E") {
    return vector4(x - halfWidth, y, 0, 1);
  } else if (pivot === "PIVOT_SE") {
    return vector4(x - halfWidth, y - halfHeight, 0, 1);
  } else if (pivot === "PIVOT_S") {
    return vector4(x, y - halfHeight, 0, 1);
  } else if (pivot === "PIVOT_SW") {
    return vector4(x + halfWidth, y - halfHeight, 0, 1);
  } else if (pivot === "PIVOT_W") {
    return vector4(x + halfWidth, y, 0, 1);
  } else if (pivot === "PIVOT_NW") {
    return vector4(x + halfWidth, y + halfHeight, 0, 1);
  }
  return centeredPosition;
}

function convertRootPosition(layer: ExportableLayer, pivot: Pivot) {
  const position = vector4(layer.x, layer.y, 0, 1);
  const pivotedPosition = calculatePivotedPosition(position, layer, pivot); 
  return pivotedPosition;
}

function calculateCenteredPosition(layer: ExportableLayer, parentSize: Vector4) {
  const x = layer.x + (layer.width / 2) - (parentSize.x / 2);
  const y = (parentSize.y / 2) - layer.y - (layer.height / 2);
  return vector4(x, y, 0, 1);
}

function convertChildPosition(layer: ExportableLayer, pivot: Pivot, parentSize: Vector4) {
  const centeredPosition = calculateCenteredPosition(layer, parentSize);
  const pivotedPosition = calculatePivotedPosition(centeredPosition, layer, pivot);
  return pivotedPosition;
}

function convertPosition(layer: ExportableLayer, pivot: Pivot, parentSize?: Vector4) {
  if (!parentSize) {
    return convertRootPosition(layer, pivot);
  }
  return convertChildPosition(layer, pivot, parentSize);
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

function convertSize(layer: ExportableLayer) {
  return vector4(layer.width, layer.height, 0, 1);
}

function calculateBoxSizeMode(texture?: string): SizeMode {
  return texture ? "SIZE_MODE_AUTO" : "SIZE_MODE_MANUAL";
}

function calculateTextSizeMode() {
  return "SIZE_MODE_MANUAL";
}

function convertBaseTransformations(layer: ExportableLayer, pivot: Pivot, parentSize?: Vector4) {
  const position = convertPosition(layer, pivot, parentSize);
  const rotation = convertRotation(layer);
  const size = convertSize(layer);
  return {
    position,
    rotation,
    size
  };

}

function convertBoxTransformations(layer: BoxLayer, pivot: Pivot, parentSize?: Vector4) {
  const baseTransformations = convertBaseTransformations(layer, pivot, parentSize);
  const scale = convertBoxScale();
  return {
    ...baseTransformations,
    scale,
  };
}

function convertTextTransformations(layer: TextLayer, pivot: Pivot, parentSize?: Vector4) {
  const baseTransformations = convertBaseTransformations(layer, pivot, parentSize);
  const scale = convertTextScale(layer);
  return {
    ...baseTransformations,
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

function calculateSlice9(layer: ExportableLayer, texture?: string) {
  if (!!texture || isFigmaText(layer)) {
    return vector4(0);
  }
  return vector4(0);
}

function calculateVisible(layer: ExportableLayer, texture?: string) {
  return !!texture || isFigmaText(layer);
}

async function convertBoxVisuals(layer: BoxLayer) {
  const color = calculateColor(layer);
  const texture = await calculateTexture(layer);
  const visible = calculateVisible(layer, texture);
  const slice9 = calculateSlice9(layer, texture);
  return {
    visible,
    color,
    texture,
    slice9
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
  const slice9 = calculateSlice9(layer);
  const font = calculateFont();
  const outline = calculateOutline(layer);
  const shadow = calculateShadow(layer); 
  return {
    visible,
    color,
    slice9,
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

function injectGUINodeDefaults() {
  return {
    ...config.guiNodeDefaultValues,
  };
}

export async function convertBoxGUINodeData(layer: BoxLayer, parentId?: string, parentSize?: Vector4): Promise<GUINodeData> {
  const id = calculateId(layer)
  const defaults = injectGUINodeDefaults();
  const data = getPluginData(layer, "defoldGUINode");
  const type = calculateType(layer);
  const pivot = calculateBoxPivot(data);
  const visuals = await convertBoxVisuals(layer);
  const sizeMode = calculateBoxSizeMode(visuals.texture);
  const transformations = convertBoxTransformations(layer, pivot, parentSize);
  const parent = convertParent(parentId);
  return {
    ...defaults,
    id,
    type,
    size_mode: sizeMode,
    ...parent,
    ...transformations,
    ...visuals,
    ...data,
  };
}

export function convertTextGUINodeData(layer: TextLayer, parentId?: string, parentSize?: Vector4): GUINodeData {
  const id = calculateId(layer)
  const defaults = injectGUINodeDefaults();
  const data = getPluginData(layer, "defoldGUINode");
  const type = calculateType(layer);
  const pivot = calculateTextPivot(layer);
  const visuals = convertTextVisuals(layer);
  const sizeMode = calculateTextSizeMode();
  const transformations = convertTextTransformations(layer, pivot, parentSize);
  const parent = convertParent(parentId);
  const text = layer.characters;
  const textParameters = calculateTextParameters(layer);
  return {
    ...defaults,
    id,
    type,
    text,
    size_mode: sizeMode,
    ...parent,
    ...transformations,
    ...visuals,
    ...textParameters,
    ...data,
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