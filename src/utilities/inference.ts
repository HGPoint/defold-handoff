/**
 * Utility module for inferring Defold properties from Figma layers.
  * @packageDocumentation
 */

import config from "config/config.json";
import { projectConfig } from "handoff/project";
import { vector4, isZeroVector } from "utilities/math";
import { resolveAtlasName } from "utilities/atlas";
import { getPluginData, setPluginData, isFigmaBox, isFigmaText, hasFont, findMainComponent, isFigmaComponentInstance, isFigmaSceneNode, isAtlas, hasSolidFills, hasSolidStrokes, isSolidPaint, isShadowEffect, hasSolidVisibleFills, isAtlasSprite, isFigmaSlice } from "utilities/figma";
import { isSlice9Layer, findPlaceholderLayer, parseSlice9Data } from "utilities/slice9";
import { tryFindFont } from "utilities/font";
import { generateContextData } from "utilities/context";
import { calculateColorValue } from "utilities/color";

/**
 * Infers the GUI node type based on the Figma layer type.
 * @param layer - The Figma layer to infer the GUI node type for.
 * @returns The inferred GUI node type.
 */
export function inferGUINodeType(layer: SceneNode) {
  if (isFigmaText(layer)) {
    return "TYPE_TEXT";
  }
  return "TYPE_BOX";
}

/**
 * Infers if the box node is visible.
 * @param layer - The box layer to infer visibility for.
 * @param texture - The texture for the box layer.
 * @returns True if the box layer is visible, otherwise false.
 */
export function inferGUIBoxNodeVisible(layer: BoxLayer, texture?: string): boolean {
  if (!texture) {
    const fills = layer.fills;
    return hasSolidVisibleFills(fills);
  }
  return true;
}

/**
 * Infers if the text node is visible.
 * @returns Always returns true.
 */
export function inferGUITextVisible(): boolean {
  return true;
}

/**
 * Infers the size mode for a box node.
 * @param layer - The box layer to infer size mode for.
 * @param texture - The texture for the box layer.
 * @returns The inferred size mode for the box layer.
 */
export async function inferBoxSizeMode(layer: ExportableLayer, texture?: string): Promise<SizeMode> {
  if (isSlice9Layer(layer)) {
    return "SIZE_MODE_MANUAL";
  }
  if (texture) {
    if (isFigmaComponentInstance(layer)) {
      const mainComponent = await findMainComponent(layer);
      if (mainComponent) {
        const { parent } = mainComponent;
        if (isFigmaSceneNode(parent) && isAtlas(parent)) {
          return mainComponent.width == layer.width && mainComponent.height == layer.height ? "SIZE_MODE_AUTO" : "SIZE_MODE_MANUAL";
        }
      }
    }
    return "SIZE_MODE_AUTO";
  }
  return "SIZE_MODE_MANUAL";
}

/**
 * Infers the size mode for text layers.
 * @returns The inferred size mode, which is always 'SIZE_MODE_MANUAL'.
 */
export function inferGUITextNodeSizeMode(): SizeMode {
  return "SIZE_MODE_MANUAL";
}

/**
 * Resolve the pivot point for a text layer.
 * @param layer - The text layer to resolve pivot point for.
 * @returns The resolved pivot point for the text layer.
 */
export function inferTextPivot(layer: TextLayer): Pivot {
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

function resolvePosition(pluginData ?: PluginGameObjectData | null) {
  return pluginData?.position || config.gameObjectDefaultValues.position
}

/**
 * Converts the rotation of a layer into a vector4 format.
 * @param layer - The Figma layer to convert rotation for.
 * @returns The converted rotation vector of the layer.
 */
export function inferRotation(layer: ExportableLayer) {
  return vector4(0, 0, layer.rotation, 1);
}

/**
 * Converts the box scale of a layer into a vector4 format.
 * @returns The converted box scale vector.
 */
export function inferScale() {
  return vector4(1);
}

/**
 * Calculates the text scale based on the font size and the default font size.
 * @param fontSize - The font size of the text layer.
 * @returns The calculated text scale vector.
 */
function calculateTextScale(fontSize: number) {
  const scale = fontSize / projectConfig.fontSize;
  return vector4(scale, scale, scale, 1);
}

/**
 * Calculates the mixed text scale based on the font size.
 * @returns The calculated mixed text scale vector.
 */
function resolveMixedTextScale() {
  return vector4(1);
}

/**
 * Converts the text scale of a text layer into a vector4 format.
 * @param layer - The text layer to convert text scale for.
 * @returns The converted text scale vector.
 */
export function inferTextScale(layer: TextNode) {
  const { fontSize } = layer;
  if (typeof fontSize !== "number") {
    return resolveMixedTextScale();
  }
  return calculateTextScale(fontSize);
}

/**
 * Converts the size of a Figma layer into a vector4 format.
 * @param layer - The Figma layer to convert size for.
 * @returns The converted size vector of the box layer.
 */
export function inferSize(layer: ExportableLayer) {
  if (isSlice9Layer(layer)) {
    const placeholder = findPlaceholderLayer(layer);
    if (placeholder) {
      return vector4(placeholder.width, placeholder.height, 0, 1);
    }
  }
  return vector4(layer.width, layer.height, 0, 1);
}

/**
 * Resolves the slice9 data for a Figma layer.
 * @param layer - The Figma layer to resolve slice9 data for.
 * @param data - GUI node data.
 * @returns The resolved slice9 data for the Figma layer.
 */
export function inferSlice9(layer: BoxLayer, data?: PluginGUINodeData | PluginGameObjectData | null) {
  const parsedSlice9 = parseSlice9Data(layer);
  if (parsedSlice9 && !isZeroVector(parsedSlice9)) {
    return parsedSlice9;
  }
  return data?.slice9 || vector4(0)
}

/**
 * Converts the size of a text layer into a vector4 format.
 * @param layer - The text layer to convert size for.
 * @param scale - The scale vector of the text layer.
 * @returns The converted size of the text layer.
 */
export function inferTextBoxSize(layer: TextLayer, scale: Vector4) {
  const { width, height } = layer;
  const scaledWidth = Math.ceil(width / scale.x);
  const scaledHeight = Math.ceil(height / scale.y);
  return vector4(scaledWidth, scaledHeight, 0, 1);
}

/**
 * Infers the layer for the GUI node.
 * @param context - The GUI context data.
 * @param pluginData - The plugin data for the GUI node.
 * @returns The inferred layer for the GUI node.
 */
export function resolveGUINodeLayer(context: PluginGUIContextData, pluginData?: PluginGUINodeData | null) {
  if (!pluginData?.layer) {
    return config.guiNodeDefaultValues.layer;
  }
  const inferredLayer = context.layers.find((layer) => layer.id === pluginData.layer);
  return inferredLayer ? inferredLayer.id : config.guiNodeDefaultValues.layer;
}

/**
 * Infers the font for the given text layer.
 * @param layer - The text layer to infer the font for.
 * @returns The inferred font for the text layer.
 */
export function inferFont(layer: TextNode) {
  if (hasFont(layer.fontName)) {
    const { family: fontFamily } = layer.fontName;
    const foundFont = tryFindFont(fontFamily);
    if (foundFont) {
      return foundFont;
    }
    return projectConfig.fontFamilies[0].id;
  }
  return "";
} 

/**
 * Resolves the texture property for a sprite within an atlas.
 * @param atlas - The atlas node containing the sprite.
 * @param layer - The sprite layer for which the texture property is to be resolved.
 * @returns The resolved texture property.
 */
function resolveGUIBoxNodeTexture(atlas: ComponentSetNode, layer: InstanceNode) {
  const atlasName = resolveAtlasName(atlas);
  const sprite = layer.variantProperties?.Sprite;
  return sprite ? `${atlasName}/${sprite}` : "";
}

/**
 * Resolves an empty texture property.
 * @returns The resolved texture property.
 */
function resolveEmptyGUIBoxNodeTexture() {
  return "";
}

/**
 * Finds the texture for the given Figma layer.
 * @param layer - The Figma layer to find the texture for.
 * @returns The texture for the layer.
 */
export async function inferGUIBoxNodeTexture(layer: ExportableLayer) {
  if (isFigmaComponentInstance(layer)) {
    const mainComponent = await findMainComponent(layer);
    if (mainComponent) {
      const { parent } = mainComponent;
      if (isFigmaSceneNode(parent) && isAtlas(parent)) {
        return resolveGUIBoxNodeTexture(parent, layer);
      }
    }
  }
  return resolveEmptyGUIBoxNodeTexture();
}

/**
 * Resolve the base color for a layer.
 * @returns The resolved base color.
 */
function resolveBaseColor() {
  return vector4(1);
}

/**
 * Resolves the base fill color.
 * @returns The resolved base fill color.
 */
function resolveBaseFill() {
  return vector4(1, 1, 1, 0);
}

/**
 * Resolve the fill color for a layer.
 * @param fills - The array of paint fills applied to the layer.
 * @returns The resolved fill color vector.
 */
function resolveFillColor(fills: readonly Paint[] | typeof figma.mixed) {
  if (Array.isArray(fills)) {
    const fill: SolidPaint | undefined = fills.find(isSolidPaint);
    if (fill) {
      return calculateColorValue(fill);
    }
  }
  return resolveBaseFill();
}

/**
 * Resolve the color for a layer.
 * @param layer - The layer to resolve color for.
 * @returns The resolved color vector.
 */
export function inferColor(layer: ExportableLayer) {
  if (isFigmaBox(layer) || isFigmaText(layer)) {
    const { fills } = layer;
    if (hasSolidFills(fills)) {
      return resolveFillColor(fills);
    }
  }
  return resolveBaseColor();
}

/**
 * Resolves the base outline color.
 * @returns The resolved base outline color.
 */
function resolveDefaultTextOutline() {
  return vector4(1, 1, 1, 0);
}

/**
 * Resolves the outline color for a text layer.
 * @param strokes - The array of strokes applied to the layer.
 * @returns The resolved outline color.
 */
function resolveOutlineTextColor(strokes: readonly Paint[]) {
  const stroke: SolidPaint | undefined = strokes.find(isSolidPaint);
  if (stroke) {
    return calculateColorValue(stroke);
  }
  return resolveDefaultTextOutline();
}

/**
 * Resolves the outline for a text layer.
 * @param layer - The text layer to resolve outline for.
 * @returns The resolved outline.
 */
export function inferTextOutline(layer: TextLayer) {
  const { strokes } = layer;
  if (hasSolidStrokes(strokes)) {
    return resolveOutlineTextColor(strokes);
  }
  return resolveDefaultTextOutline();
}

/**
 * Resolves the base shadow.
 * @returns The resolved base shadow.
 */
function resolveDefaultTextShadowColor() {
  return vector4(1, 1, 1, 0);
}

/**
 * Resolves the shadow for a text layer.
 * @param effect - The drop shadow effect applied to the layer.
 * @returns The resolved shadow.
 */
function resolveTextShadowColor(effect: DropShadowEffect) {
  const { color: { r, g, b, a } } = effect;
  return vector4(r, g, b, a);
}

/**
 * Resolves the shadow for a text layer.
 * @param layer - The text layer to resolve a shadow for.
 * @returns The resolved shadow.
 */
export function inferTextShadow(layer: TextLayer) {
  const effect = layer.effects.find(isShadowEffect);
  if (effect) {
    return resolveTextShadowColor(effect);
  }
  return resolveDefaultTextShadowColor();
}

/**
 * Resolves whether the text has line breaks.
 * @param layer - The text layer to resolve line break for.
 * @returns True if the text has line breaks, otherwise false.
 */
export function inferLineBreak(layer: TextLayer) {
  return layer.textAutoResize === "HEIGHT" || layer.textAutoResize === "NONE";
}

/**
 * Calculates the leading (line height) of the text.
 * @param layer - The text layer to calculate leading for.
 * @returns The calculated text leading.
 */
export function inferTextLeading(layer: TextLayer) {
  const { lineHeight, fontSize } = layer;
  if (typeof lineHeight === "object" && "value" in lineHeight && typeof fontSize === "number") {
    return lineHeight.value / fontSize;
  }
  return 1;
}

/**
 * Calculates the tracking (letter spacing) of the text.
 * @param layer - The text layer to calculate tracking for.
 * @returns The calculated text tracking.
 */
export function inferTextTracking(layer: TextLayer) {
  if (typeof layer.letterSpacing == "number") {
    return layer.letterSpacing;
  }
  return 0
}

/**
 * Resolves the clipping visible property for a layer.
 * @param layer - The layer to resolve clipping visible for.
 * @returns The resolved clipping visible property.
 */
export function inferClippingVisible(layer: BoxLayer) {
  return layer.clipsContent;
}

/**
 * Resolves the text content for a text layer
 * @param layer - The text layer to resolve text for.
 * @returns The resolved text for the text layer.
 */
export function inferText(layer: TextLayer) {
  const text = layer.characters.trim();
  const lines = text.split("\n");
  if (lines.length > 1) {
    return lines.join("\\n\"\n\"");
  }
  return text;
}

function resolveId(layer: SceneNode, pluginData?: PluginGUINodeData | PluginGameObjectData | null) {
  return pluginData?.id || layer.name;
}

function resolveType(fallbackType: GameObjectType, pluginData?: PluginGameObjectData | null): GameObjectType;
function resolveType(fallbackType: GUINodeType, pluginData?: PluginGUINodeData | null): GUINodeType;
function resolveType(fallbackType: GameObjectType | GUINodeType, pluginData?: PluginGameObjectData | PluginGUINodeData | null): GameObjectType | GUINodeType {
  return pluginData?.type || fallbackType;
}

function resolveGUINodeDefaultValues() {
  return {
    ...config.guiNodeDefaultValues,
    ...config.guiNodeDefaultSpecialValues,
  };
}

/**
 * Infers properties for a text node.
 * @param layer - The text node to infer data for.
 * @param pluginData - The plugin data for the text node.
 * @returns The inferred text node data.
 */
export function inferGUITextNodeData(layer: TextNode, pluginData?: PluginGUINodeData | null) {
  const context = generateContextData(layer);
  const id = resolveId(layer, pluginData);
  const type = resolveType("TYPE_TEXT", pluginData);
  const sizeMode = inferGUITextNodeSizeMode();
  const visible = inferGUITextVisible();
  const font = inferFont(layer);
  const guiLayer = resolveGUINodeLayer(context, pluginData);
  return {
    id,
    type,
    layer: guiLayer,
    visible,
    size_mode: sizeMode,
    font,
  };
}

/**
 * Infers properties for a text node and sets plugin data.
 * @param layer - The text layer to infer properties for.
 */
export function inferGUITextNode(layer: TextNode) {
  const pluginData = getPluginData(layer, "defoldGUINode");
  const inferredData = inferGUITextNodeData(layer, pluginData); 
  const defaultValues = resolveGUINodeDefaultValues();
  const data = {
    ...defaultValues,
    ...pluginData,
    ...inferredData,
    inferred: true,
    figma_node_type: layer.type,
  };
  const guiNodeData = { defoldGUINode: data };
  setPluginData(layer, guiNodeData);
  inferTextStrokeWeight(layer);
}

/**
 * Infers properties for a GUI node.
 * @param layer - The GUI node layer to infer properties for.
 * @param pluginData - The plugin data for the GUI node.
 * @returns The inferred GUI node data.
 */
export async function inferGUIBoxNodeData(layer: BoxLayer, pluginData?: PluginGUINodeData | null) {
  const context = generateContextData(layer);
  const id = resolveId(layer, pluginData);
  const type = resolveType("TYPE_BOX", pluginData);
  const texture = await inferGUIBoxNodeTexture(layer);
  const sizeMode = await inferBoxSizeMode(layer, texture);
  const visible = inferGUIBoxNodeVisible(layer, texture);
  const guiLayer = resolveGUINodeLayer(context, pluginData);
  const data = {
    id,
    type,
    layer: guiLayer,
    visible,
    size_mode: sizeMode,
    inferred: true,
  };
  return data;
}

/**
 * Infers properties for a box node and sets plugin data.
 * @param layer - The box layer to infer properties for.
 */
export async function inferGUIBoxNode(layer: BoxLayer) {
  const pluginData = getPluginData(layer, "defoldGUINode");
  const inferredData = await inferGUIBoxNodeData(layer, pluginData);
  const defaultValues = resolveGUINodeDefaultValues();
  const data = {
    ...defaultValues,
    ...pluginData,
    ...inferredData,
    inferred: true,
    figma_node_type: layer.type,
  };
  const guiNodeData = { defoldGUINode: data };
  setPluginData(layer, guiNodeData);
}

export async function inferGUINode(layer: SceneNode, inferChildren = true) {
  if (isFigmaBox(layer)) {
    inferGUIBoxNode(layer);
    if (inferChildren && layer.children) {
      inferGUINodes(layer.children);
    }
  } else if (isFigmaText(layer)) {
    inferGUITextNode(layer);
  }
}

/**
 * Infers properties for multiple GUI nodes.
 * @param layers - The array of Figma layers to infer properties for.
 */
export function inferGUINodes(layers: readonly SceneNode[]) {
  for (const layer of layers) {
    inferGUINode(layer);
  }
}

/**
 * Resolves the background color for the GUI component.
 * @returns The resolved background color.
 */
export function inferBackgroundColor() {
  return vector4(0);
}

function resolveGameObjectSprite(atlas: ComponentSetNode, layer: InstanceNode) {
  const atlasName = resolveAtlasName(atlas);
  const sprite = layer.variantProperties?.Sprite;
  return {
    image: sprite ? atlasName : "",
    default_animation: sprite ?? ""
  };
}

function resolveGameObjectImpliedSprite(layer: SliceLayer) {
  const parent = layer.parent;
  const atlasName = parent ? parent.name : layer.name;
  return {
    image: atlasName,
    default_animation: layer.name
  };
}

function resolveGameObjectEmptySprite() {
  return {
    image: undefined,
    default_animation: undefined
  };
}

export async function inferSpriteComponentSprite(layer: ExportableLayer) {
  if (isFigmaComponentInstance(layer)) {
    const mainComponent = await findMainComponent(layer);
    if (mainComponent) {
      const { parent } = mainComponent;
      if (isFigmaSceneNode(parent) && isAtlas(parent)) {
        return resolveGameObjectSprite(parent, layer);
      }
    }
  }
  if (isFigmaSlice(layer)) {
    return resolveGameObjectImpliedSprite(layer);
  }
  return resolveGameObjectEmptySprite();
}

async function inferSpriteComponentData(layer: BoxLayer, pluginData?: PluginGameObjectData | null) {
  const id = resolveId(layer, pluginData);
  const type = resolveType("TYPE_SPRITE", pluginData);
  const position = resolvePosition(pluginData);
  return {
    id,
    type,
    position,
  };
}

export function injectSpriteComponentDefaultValues() {
  const { scale, size_mode, slice9, material, blend_mode } = config.gameObjectDefaultValues;
  return {
    scale,
    size_mode,
    slice9,
    material,
    blend_mode,
    ...config.gameObjectDefaultSpecialValues,
  };
}

async function inferSpriteComponent(layer: BoxLayer) {
  const pluginData = getPluginData(layer, "defoldGameObject");
  const inferredData = await inferSpriteComponentData(layer, pluginData);
  const defaultValues = injectSpriteComponentDefaultValues();
  const data = {
    ...defaultValues,
    ...pluginData,
    ...inferredData,
    inferred: true,
    figma_node_type: layer.type,
  };
  const gameObjectData = { defoldGameObject: data };
  setPluginData(layer, gameObjectData);
}

function inferEmptyComponentData(layer: BoxLayer, pluginData?: PluginGameObjectData | null) {
  const id = resolveId(layer, pluginData);
  const type = resolveType("TYPE_EMPTY", pluginData);
  const position = resolvePosition(pluginData);
  return {
    id,
    type,
    position,
  };
}

export function injectEmptyComponentDefaultValues() {
  const { scale } = config.gameObjectDefaultValues;
  return {
    scale,
    ...config.gameObjectDefaultSpecialValues,
  };
}

function inferEmptyComponent(layer: BoxLayer) {
  const pluginData = getPluginData(layer, "defoldGameObject");
  const inferredData = inferEmptyComponentData(layer, pluginData);
  const defaultValues = injectEmptyComponentDefaultValues();
  const data = {
    ...defaultValues,
    ...pluginData,
    ...inferredData,
    inferred: true,
    figma_node_type: layer.type,
  };
  const gameObjectData = { defoldGameObject: data };
  setPluginData(layer, gameObjectData);
}

function inferLabelComponentData(layer: TextNode, pluginData?: PluginGameObjectData | null) {
  const id = resolveId(layer, pluginData);
  const type = resolveType("TYPE_LABEL", pluginData);
  const position = resolvePosition(pluginData);
  return {
    id,
    type,
    position,
  };
}

export function injectLabelComponentDefaultValues() {
  const { scale, pivot, blend_mode } = config.gameObjectDefaultValues;
  return {
    scale,
    pivot,
    blend_mode,
    ...config.gameObjectDefaultSpecialValues,
  };
}

export function inferLabelComponent(layer: TextNode) {
  const pluginData = getPluginData(layer, "defoldGameObject");
  const inferredData = inferLabelComponentData(layer, pluginData);
  const defaultValues = injectLabelComponentDefaultValues();
  const data = {
    ...defaultValues,
    ...pluginData,
    ...inferredData,
    inferred: true,
    figma_node_type: layer.type,
  };
  const gameObjectData = { defoldGameObject: data };
  setPluginData(layer, gameObjectData);
  inferTextStrokeWeight(layer);
}

export async function inferGameObject(layer: SceneNode, inferChildren = true) {
  if (isFigmaBox(layer)) {
    if (await isAtlasSprite(layer)) {
      inferSpriteComponent(layer);
    } else {
      inferEmptyComponent(layer);
      if (inferChildren && layer.children) {
        inferGameObjects(layer.children);
      }
    }
  } else if (isFigmaText(layer)) {
    inferLabelComponent(layer);
  }
}

/**
 * Infers properties for multiple game objects.
 * @param layers - The array of Figma layers to infer properties for.
 */
export async function inferGameObjects(layers: readonly SceneNode[]) {
  for (const layer of layers) {
    await inferGameObject(layer);
  }
}

/**
 * Infers the stroke weight for the text layer.
 * @param layer - The text layer to infer the stroke weight for.
 */
export function inferTextStrokeWeight(layer: TextNode) {
  if (typeof layer.fontSize === "number") {
    const strokeWeight = layer.fontSize * projectConfig.fontStrokeRatio;
    layer.strokeWeight = strokeWeight;
  }
}