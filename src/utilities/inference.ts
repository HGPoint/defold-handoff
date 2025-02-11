/**
 * Handles Defold-like property inference from Figma layer properties.
 * @packageDocumentation
 */

import config from "config/config.json";
import { PROJECT_CONFIG } from "handoff/project";
import { resolveAtlasName } from "utilities/atlas";
import { convertSpriteName } from "utilities/atlasConversion";
import { resolveBaseBackgroundColor, resolveBaseColor, resolveBaseTextOutline, resolveBaseTextShadowColor } from "utilities/color";
import { generateContextData } from "utilities/context";
import { isLayerInferred } from "utilities/data";
import { injectEmptyComponentDefaults, injectGUINodeDefaults, injectLabelComponentDefaults, injectSpriteComponentDefaults } from "utilities/defaults";
import { findMainFigmaComponent, getPluginData, hasChildren, hasFont, hasParent, hasSolidNonWhiteFills, hasSolidStrokes, hasSolidVisibleFills, isFigmaBox, isFigmaComponentInstance, isFigmaRectangle, isFigmaSlice, isFigmaText, isLayerAtlas, isLayerExportable, isLayerNode, isLayerSprite, isShadowEffect, resolveFillColor, resolveTextOutlineColor, resolveTextShadowColor, setPluginData } from "utilities/figma";
import { tryFindFont } from "utilities/font";
import { isZeroVector, readableNumber, readableVector, vector4 } from "utilities/math";
import { calculateCenteredPosition, convertCenteredPositionToPivotedPosition } from "utilities/pivot";
import { findSlice9PlaceholderLayer, isSlice9Layer, parseSlice9Data } from "utilities/slice9";
import { calculateTextScale, calculateTextStrokeWeight, resolveText } from "utilities/text";

/**
 * Infers properties for GUI.
 * @param layers - The Figma layers to infer properties from.
 */
export function inferGUI(layers: readonly SceneNode[], inferChildren = true, forceInfer = false) {
  for (const layer of layers) {
    inferGUINode(layer, inferChildren, forceInfer);
  }
}

/**
 * Infers properties for the GUI node.
 * @param layer - The Figma layer to infer properties from.
 * @param inferChildren - Whether to infer children of the layer.
 * @param forceInfer - Whether to force inference even if the layer is already inferred.
 */
export async function inferGUINode(layer: SceneNode, inferChildren = true, forceInfer = false) {
  const shouldInfer = !isLayerInferred(layer, "defoldGUINode") || forceInfer;
  if (isFigmaBox(layer)) {
    if (shouldInfer) {
      inferGUIBox(layer);
    }
    if (inferChildren && layer.children) {
      inferGUI(layer.children, inferChildren, forceInfer);
    }
  } else if (isFigmaText(layer) && shouldInfer) {
    inferGUIText(layer);
  }
}

/**
 * Infers properties for the GUI text node and bounds the inferred data to the Figma layer.
 * @param layer - The Figma layer to infer properties from.
 */
export function inferGUIText(layer: TextNode) {
  const pluginData = getPluginData(layer, "defoldGUINode");
  const inferredData = inferGUITextData(layer, pluginData);
  const defaults = injectGUINodeDefaults();
  const data = {
    ...defaults,
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
 * Infers properties for the GUI text node.
 * @param layer - The Figma layer to infer properties from.
 * @param pluginData - The plugin data already bound to the Figma layer.
 * @returns The inferred GUI text node data.
 */
export function inferGUITextData(layer: TextNode, pluginData?: WithNull<PluginGUINodeData>) {
  const context = generateContextData(layer);
  const id = resolveId(layer, pluginData);
  const type = resolveType("TYPE_TEXT", pluginData);
  const sizeMode = inferGUITextSizeMode();
  const visible = inferGUITextVisible();
  const font = inferFont(layer);
  const guiLayer = resolveGUILayer(context, pluginData);
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
 * Infers properties for the GUI box node and bounds the inferred data to the Figma layer.
 * @param layer - The Figma layer to infer properties from.
 */
export async function inferGUIBox(layer: BoxLayer) {
  const pluginData = getPluginData(layer, "defoldGUINode");
  const inferredData = await inferGUIBoxData(layer, pluginData);
  const defaults = injectGUINodeDefaults();
  const data = {
    ...defaults,
    ...pluginData,
    ...inferredData,
    inferred: true,
    figma_node_type: layer.type,
  };
  const guiNodeData = { defoldGUINode: data };
  setPluginData(layer, guiNodeData);
}

/**
 * Infers properties for the GUI box node.
 * @param layer - The Figma layer to infer properties from.
 * @param pluginData - The plugin data already bound to the Figma layer.
 * @returns The inferred GUI box node data.
 */
export async function inferGUIBoxData(layer: BoxLayer, pluginData?: WithNull<PluginGUINodeData>) {
  const context = generateContextData(layer);
  const id = resolveId(layer, pluginData);
  const type = resolveType("TYPE_BOX", pluginData);
  const { texture } = await inferGUIBoxTexture(layer);
  const sizeMode = await inferSizeMode(layer);
  const visible = inferGUIBoxVisible(layer, texture);
  const guiLayer = resolveGUILayer(context, pluginData);
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
 * Resolves the ID for the GUI node or game object.
 * @param layer - The Figma layer to infer ID from.
 * @param pluginData - The plugin data already bound to the Figma layer.
 * @returns The resolved ID for the GUI node or game object.
 */
function resolveId(layer: SceneNode, pluginData?: WithNull<PluginGUINodeData | PluginGameObjectData>) {
  return pluginData?.id || layer.name;
}

/**
 * Resolves the type for the GUI node or game object.
 * @param fallbackType - The fallback type to use if the type cannot be inferred.
 * @param pluginData - The plugin data already bound to the Figma layer.
 * @returns The resolved type for the GUI node or game object.
 */
function resolveType(fallbackType: GameObjectType, pluginData?: WithNull<PluginGameObjectData>): GameObjectType;
function resolveType(fallbackType: GUINodeType, pluginData?: WithNull<PluginGUINodeData>): GUINodeType;
function resolveType(fallbackType: GameObjectType | GUINodeType, pluginData?: WithNull<PluginGameObjectData | PluginGUINodeData>): GameObjectType | GUINodeType {
  return pluginData?.type || fallbackType;
}


/**
 * Infers the type of the GUI node based on the type of Figma layer.
 * @param layer - The Figma layer to infer GUI node type from.
 * @returns The inferred GUI node type.
 */
export function inferGUINodeType(layer: SceneNode) {
  if (isFigmaText(layer)) {
    return "TYPE_TEXT";
  }
  return "TYPE_BOX";
}

/**
 * Infers the visibility of the box GUI node.
 * @param layer - The Figma layer to infer visibility from.
 * @param texture - The the box GUI node texture.
 * @returns The inferred visibility of the box GUI node.
 */
export function inferGUIBoxVisible(layer: BoxLayer, texture?: string): boolean {
  if (!texture) {
    const fills = layer.fills;
    return hasSolidNonWhiteFills(fills);
  }
  return true;
}

/**
 * Infers the visibility of the text GUI node.
 * @returns The inferred visibility of the text GUI node, which is always true.
 */
export function inferGUITextVisible(): boolean {
  return true;
}

/**
 * Infers the size mode for the GUI box node or game object.
 * @param layer - The Figma layer to infer size mode from.
 * @param texture - The the box GUI node or game object texture.
 * @returns The inferred size mode for the GUI box node.
 */
export async function inferSizeMode(layer: ExportableLayer): Promise<SizeMode> {
  if (await isLayerSprite(layer) && isFigmaComponentInstance(layer)) {
    const sizeMode = await inferSpriteSizeMode(layer);
    return sizeMode;
  }
  return "SIZE_MODE_MANUAL";
}

/**
 * Infers the size mode for the box GUI node based on the size of the sprite layer.
 * @param layer - The Figam layer to infer size mode from.
 * @returns The inferred size mode for the box GUI node.
 */
async function inferSpriteSizeMode(layer: InstanceNode): Promise<SizeMode> {
  const mainComponent = await findMainFigmaComponent(layer);
  if (mainComponent) {
    const { parent } = mainComponent;
    if (parent && isLayerAtlas(parent)) {
      const { width: mainWidth, height: mainHeight } = mainComponent;
      const sizedLayer = isSlice9Layer(layer) ? findSlice9PlaceholderLayer(layer) : layer;
      if (sizedLayer) {
        const { width, height } = sizedLayer;      
        const isSameSize = mainWidth == width && mainHeight == height;
        const sizeMode = isSameSize ? "SIZE_MODE_AUTO" : "SIZE_MODE_MANUAL";
        return sizeMode;
      }
    }
  }
  return "SIZE_MODE_AUTO";
}

/**
 * Infers the size mode for the text GUI node.
 * @returns The inferred size mode for the text GUI node, which is always manual.
 */
export function inferGUITextSizeMode(): SizeMode {
  return "SIZE_MODE_MANUAL";
}

/**
 * Infers the pivot point for the text GUI node.
 * @param layer - The Figma layer to infer pivot point from.
 * @returns The inferred pivot point for the text GUI node.
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

/**
 * Infers the position for the GUI node or game object.
 * @param pluginData - The plugin data bound to the Figma layer.
 * @returns The inferred position for GUI node the game object.
 */
function resolvePosition(pluginData ?: WithNull<PluginGameObjectData>) {
  return pluginData?.position || config.gameObjectDefaultValues.position
}

/**
 * Infers the rotation for the GUI node or game object.
 * @param layer - The Figma layer to infer rotation from.
 * @returns The inferred rotation for the GUI node or game object.
 */
export function inferRotation(layer: SceneNode) {
  if (isLayerExportable(layer) || isFigmaRectangle(layer)) {
    return vector4(0, 0, readableNumber(layer.rotation), 0);
  }
  return vector4(0);
}

/**
 * Infers the scale for the GUI node or game object.
 * @returns The inferred scale for the GUI node or game object, which is always 1.
 */
export function inferScale() {
  return vector4(1);
}

/**
 * Infers the text scale for the text GUI node or label game object.
 * @param layer - The Figma layer to infer text scale from.
 * @returns The inferred text scale for the text GUI node or label game object.
 */
export function inferTextScale(layer: TextNode) {
  const { fontSize } = layer;
  if (typeof fontSize !== "number") {
    return resolveMixedTextScale();
  }
  return calculateTextScale(fontSize);
}

/**
 * Resolves the mixed text scale.
 * @returns The resolved mixed text scale, which is always 1.
 */
function resolveMixedTextScale() {
  return vector4(1);
}

/**
 * Infers the size of the GUI node or game object.
 * @param layer - The Figma layer to infer size from.
 * @returns The inferred size of the GUI node or game object.
 */
export function inferSize(layer: SceneNode) {
  if (isSlice9Layer(layer)) {
    const placeholder = findSlice9PlaceholderLayer(layer);
    if (placeholder) {
      const size = vector4(placeholder.width, placeholder.height, 0, 0);
      const readableSize = readableVector(size);
      return readableSize;
    }
  }
  const size = vector4(layer.width, layer.height, 0, 0);
  const readableSize = readableVector(size);
  return readableSize;
}

/**
 * Infers the size of the text box for the text GUI node or label game object.
 * @param layer - The text layer to infer text box size from.
 * @param scale - The scale of the text layer.
 * @returns The inferred size of the text box for the text GUI node or label game object.
 */
export function inferTextBoxSize(layer: TextLayer, scale: Vector4) {
  const { width, height } = layer;
  const scaledWidth = Math.ceil(width / scale.x);
  const scaledHeight = Math.ceil(height / scale.y);
  return vector4(scaledWidth, scaledHeight, 0, 0);
}

/**
 * Infers the slice9 data for the GUI node or game object.
 * @param layer - The Figma layer to infer slice9 data from.
 * @param data - The plugin data bound to the Figma layer.
 * @returns The inferred slice9 data for the GUI node or game object.
 */
export function inferSlice9(layer: BoxLayer, data?: WithNull<PluginGUINodeData | PluginGameObjectData>) {
  const parsedSlice9 = parseSlice9Data(layer);
  if (parsedSlice9 && !isZeroVector(parsedSlice9)) {
    return parsedSlice9;
  }
  return data?.slice9 || vector4(0)
}

/**
 * Infers the layer for the GUI node.
 * @param context - The GUI context data.
 * @param pluginData - The plugin data bound to the Figma layer.
 * @returns The inferred layer for the GUI node.
 */
export function resolveGUILayer(context: PluginContextData, pluginData?: WithNull<PluginGUINodeData>) {
  if (!pluginData?.layer) {
    return config.guiNodeDefaultValues.layer;
  }
  const inferredLayer = context.layers.find((layer) => layer.id === pluginData.layer);
  return inferredLayer ? inferredLayer.id : config.guiNodeDefaultValues.layer;
}

/**
 * Infers the font for the GUI text node or label game object.
 * @param layer - The Figam layer to infer font from.
 * @returns The inferred font for the GUI text node or label game object.
 */
export function inferFont(layer: TextNode) {
  if (hasFont(layer.fontName)) {
    const { family: fontFamily } = layer.fontName;
    const foundFont = tryFindFont(fontFamily);
    if (foundFont) {
      return foundFont;
    }
    return PROJECT_CONFIG.fontFamilies[0].id;
  }
  return "";
}

/**
 * Infers the texture for the GUI box node.
 * @param layer - The Figma layer to infer texture from.
 * @returns The inferred texture for the GUI box node.
 */
export async function inferGUIBoxTexture(layer: ExportableLayer) {
  if (isFigmaComponentInstance(layer)) {
    const mainComponent = await findMainFigmaComponent(layer);
    if (mainComponent) {
      const { parent } = mainComponent;
      if (parent && isLayerAtlas(parent)) {
        return resolveGUIBoxTexture(parent, layer, mainComponent);
      }
    }
  }
  return resolveEmptyGUIBoxTexture();
}

/**
 * Resolves the texture property for the GUI box node.
 * @param atlas - The atlas containing the sprite layer.
 * @param layer - The sprite layer to resolve texture from.
 * @returns The resolved texture property.
 */
function resolveGUIBoxTexture(atlas: ComponentSetNode, layer: InstanceNode, spriteLayer: ComponentNode) {
  const atlasName = resolveAtlasName(atlas);
  const sprite = layer.variantProperties?.Sprite;
  const textures = sprite ? `${atlasName}/${sprite}` : "";
  const size = vector4(spriteLayer.width, spriteLayer.height, 0, 0);
  return {
    texture: textures,
    size,
  }
}

/**
 * Resolves the empty texture property for the GUI box node.
 * @returns The resolved empty texture property, which is always an empty string.
 */
function resolveEmptyGUIBoxTexture() {
  return {
    texture: "",
    size: vector4(0),
  };
}

export async function resolveGUITextSpriteNodeImpliedSprite(layer: TextNode) {
  const name = convertSpriteName(layer);
  const texture = `text_layers/${name}`;
  const bytes = await layer.exportAsync({ format: "PNG" });
  const image = figma.createImage(bytes);
  const { width, height } = await image.getSizeAsync();
  const size = vector4(width, height, 0, 0);
  return {
    texture,
    size,
  };
}

/**
 * Infers the color for the GUI node or game object.
 * @param layer - The Figma layer to infer color from.
 * @returns The inferred color for the GUI node or game object.
 */
export function inferColor(layer: SceneNode) {
  if (isLayerNode(layer)) {
    const { fills } = layer;
    if (hasSolidVisibleFills(fills)) {
      return resolveFillColor(fills);
    }
  }
  return resolveBaseColor();
}

/**
 * Infers the background color for the GUI.
 * @returns The inferred background color for the GUI.
 */
export function inferBackgroundColor() {
  return resolveBaseBackgroundColor();
}

/**
 * Infers the outline for the GUI text node or label game object.
 * @param layer - The Figma layer to infer outline from.
 * @returns The inferred outline for the GUI text node or label game object.
 */
export function inferTextOutline(layer: TextLayer) {
  const { strokes } = layer;
  if (hasSolidStrokes(strokes)) {
    return resolveTextOutlineColor(strokes);
  }
  return resolveBaseTextOutline();
}

/**
 * Infers the stroke weight for the GUI text node or label game object. 
 * @param layer - The Figma layer to infer stroke weight from.
 */
export function inferTextStrokeWeight(layer: TextNode) {
  if (typeof layer.fontSize === "number") {
    const { fontSize } = layer;
    const strokeWeight = calculateTextStrokeWeight(fontSize);
    layer.strokeWeight = strokeWeight;
  }
}

/**
 * Infers the shadow for the GUI text node or label game object.
 * @param layer - The Figma layer to infer shadow from.
 * @returns The inferred shadow for the GUI text node or label game object.
 */
export function inferTextShadow(layer: TextLayer) {
  const effect = layer.effects.find(isShadowEffect);
  if (effect) {
    return resolveTextShadowColor(effect);
  }
  return resolveBaseTextShadowColor();
}

/**
 * Infers whether the text has line breaks for the GUI text node or label game object.
 * @param layer - The Figma layer to infer line breaks from.
 * @returns Whether the text has line breaks.
 */
export function inferLineBreak(layer: TextLayer) {
  return layer.textAutoResize === "HEIGHT" || layer.textAutoResize === "NONE";
}

/**
 * Infers the text leading (line height) for the GUI text node or label game object.
 * @param layer - The Figma layer to infer text leading from.
 * @returns The inferred text leading for the GUI text node or label game object.
 */
export function inferTextLeading(layer: TextLayer) {
  const { lineHeight, fontSize } = layer;
  if (typeof lineHeight === "object" && "value" in lineHeight && typeof fontSize === "number") {
    return lineHeight.value / fontSize;
  }
  return 1;
}

/**
 * Infers the text tracking (letter spacing) for the GUI text node or label game object.
 * @param layer - The Figma layer to infer text tracking from.
 * @returns The inferred text tracking for the GUI text node or label game object.
 */
export function inferTextTracking(layer: TextLayer) {
  if (typeof layer.letterSpacing == "number") {
    return layer.letterSpacing;
  }
  return 0
}

/**
 * Infers the clipping visible property for the GUI node.
 * @param layer - The Figma layer to infer clipping visible property from.
 * @returns The inferred clipping visible property for the GUI node.
 */
export function inferClippingVisible(layer: BoxLayer) {
  return layer.clipsContent;
}

/**
 * Infers the text content for the GUI text node or label game object.
 * @param layer - The Figma layer to infer text content from.
 * @returns The inferred text content for the GUI text node or label game object.
 */
export function inferText(layer: TextLayer) {
  const text = layer.characters.trim();
  const resolvedText = resolveText(text);
  return resolvedText;
}

/**
 * Infers properties for the game objects.
 * @param layers - The Figma layers to infer properties from.
 */
export async function inferGameObjects(layers: readonly SceneNode[], inferChildren = true, forceInfer = false) {
  const inferencePromises = layers.map((layer) => inferGameObject(layer, inferChildren, forceInfer));
  await Promise.all(inferencePromises);
}

/**
 * Infers properties for the game object.
 * @param layer - The Figma layer to infer properties from.
 * @param inferChildren - Whether to infer children of the layer.
 * @param forceInfer - Whether to force inference even if the layer is already inferred.
 */
export async function inferGameObject(layer: SceneNode, inferChildren = true, forceInfer = false) {
  const shouldInfer = !isLayerInferred(layer, "defoldGameObject") || forceInfer;
  if (isFigmaBox(layer)) {
    if ((shouldInfer) && await isLayerSprite(layer)) {
      inferSpriteComponent(layer);
    } else {
      if (shouldInfer) {
        inferEmptyComponent(layer);
      }
      if (inferChildren && hasChildren(layer)) {
        inferGameObjects(layer.children, inferChildren, forceInfer);
      }
    }
  } else if (isFigmaText(layer)) {
    if (shouldInfer) {
      inferLabelComponent(layer);
    }
  }
}

/**
 * Infers properties for the base game object and bounds the inferred data to the Figma layer.
 * @param layer - The Figma layer to infer properties from.
 * @param forceInfer - Whether to force inference even if the layer is already inferred.
 */
function inferEmptyComponent(layer: BoxLayer) {
  const pluginData = getPluginData(layer, "defoldGameObject");
  const inferredData = inferEmptyComponentData(layer, pluginData);
  const defaults = injectEmptyComponentDefaults();
  const data = {
    ...defaults,
    ...pluginData,
    ...inferredData,
    inferred: true,
    figma_node_type: layer.type,
  };
  const gameObjectData = { defoldGameObject: data };
  setPluginData(layer, gameObjectData);
}

/**
 * Infers properties for the base game object.
 * @param layer - The Figma layer to infer properties from.
 * @param pluginData - The plugin data already bound to the Figma layer.
 * @returns The inferred base game object data.
 */
function inferEmptyComponentData(layer: BoxLayer, pluginData?: WithNull<PluginGameObjectData>) {
  const id = resolveId(layer, pluginData);
  const type = resolveType("TYPE_EMPTY", pluginData);
  const position = resolvePosition(pluginData);
  return {
    id,
    type,
    position,
  };
}

/**
 * Infers properties for the sprite game object and bounds the inferred data to the Figma layer.
 * @param layer - The Figma layer to infer properties from.
 */
async function inferSpriteComponent(layer: BoxLayer) {
  const pluginData = getPluginData(layer, "defoldGameObject");
  const inferredData = await inferSpriteComponentData(layer, pluginData);
  const defaults = injectSpriteComponentDefaults();
  const data = {
    ...defaults,
    ...pluginData,
    ...inferredData,
    inferred: true,
    figma_node_type: layer.type,
  };
  const gameObjectData = { defoldGameObject: data };
  setPluginData(layer, gameObjectData);
}

/**
 * Infers properties for the sprite game object.
 * @param layer - The Figma layer to infer properties from.
 * @param pluginData - The plugin data already bound to the Figma layer.
 * @returns The inferred sprite game object data.
 */
async function inferSpriteComponentData(layer: BoxLayer, pluginData?: WithNull<PluginGameObjectData>) {
  const id = resolveId(layer, pluginData);
  const type = resolveType("TYPE_SPRITE", pluginData);
  const position = resolvePosition(pluginData);
  return {
    id,
    type,
    position,
  };
}

/**
 * Infers properties for the label game object and bounds the inferred data to the Figma layer.
 * @param layer - The Figma layer to infer properties from.
 */
export function inferLabelComponent(layer: TextNode) {
  const pluginData = getPluginData(layer, "defoldGameObject");
  const inferredData = inferLabelComponentData(layer, pluginData);
  const defaults = injectLabelComponentDefaults();
  const data = {
    ...defaults,
    ...pluginData,
    ...inferredData,
    inferred: true,
    figma_node_type: layer.type,
  };
  const gameObjectData = { defoldGameObject: data };
  setPluginData(layer, gameObjectData);
  inferTextStrokeWeight(layer);
}

/**
 * Infers properties for the label game object.
 * @param layer - The Figma layer to infer properties from.
 * @param pluginData - The plugin data already bound to the Figma layer.
 * @returns The inferred label game object data.
 */
function inferLabelComponentData(layer: TextNode, pluginData?: WithNull<PluginGameObjectData>) {
  const id = resolveId(layer, pluginData);
  const type = resolveType("TYPE_LABEL", pluginData);
  const position = resolvePosition(pluginData);
  return {
    id,
    type,
    position,
  };
}

/**
 * Infers the game object type based on the Figma layer type.
 * @param layer - The Figma layer to infer game object type from.
 * @returns The inferred game object type.
 */
export async function inferGameObjectType(layer: SceneNode) {
  if (isFigmaText(layer)) {
    return "TYPE_LABEL";
  }
  if (await isLayerSprite(layer)) {
    return "TYPE_SPRITE";
  }
  return "TYPE_EMPTY";
}

/**
 * Infers the game collection parent transformations.
 * @param layer - The Figma layer to infer parent transformations from.
 * @returns The inferred game collection parent transformations.
 */
export function inferGameCollectionParentTransformations(layer: ExportableLayer) {
  if (hasParent(layer)) {
    const { parent: { width, height, x, y } } = layer;
    return {
      parentSize: vector4(width, height, 0, 0),
      parentShift: vector4(-x, -y, 0, 0),
    }
  }
  return {
    parentSize: vector4(0),
    parentShift: vector4(0),
  }
}

/**
 * Infers the game object position.
 * @param layer - The Figma layer to infer position from.
 * @param pluginData - The plugin data already bound to the Figma layer.
 * @returns The inferred game object position.
 */
export function resolveGameObjectPosition(layer: BoxLayer | SliceNode, pluginData?: WithNull<PluginGameObjectData>): Vector4 {
  const backupPosition = pluginData?.position || config.gameObjectDefaultValues.position
  const { parent } = layer;
  if (parent && isLayerExportable(parent)) {
    const size = inferSize(layer);
    const parentSize = inferSize(parent);
    const centeredPosition = calculateCenteredPosition(layer, size, parentSize);
    centeredPosition.z = backupPosition.z
    return {
      ...config.gameObjectDefaultValues.position,
      ...pluginData?.position,
      ...centeredPosition
    }
  }
  return backupPosition
}

/**
 * Infers the label game object position.
 * @param layer - The Figma layer to infer position from.
 * @param pluginData - The plugin data already bound to the Figma layer.
 * @returns The inferred the label game object position.
 */
export function resolveLabelComponentPosition(layer: TextLayer, pluginData?: WithNull<PluginGameObjectData>): Vector4 {
  const backupPosition = pluginData?.position || config.gameObjectDefaultValues.position
  const { parent } = layer;
  if (parent && isLayerExportable(parent)) {
    const size = inferSize(layer);
    const parentSize = inferSize(parent);
    const centeredPosition = calculateCenteredPosition(layer, size, parentSize);
    const position = convertCenteredPositionToPivotedPosition(centeredPosition, "PIVOT_CENTER", parentSize);
    position.z = backupPosition.z
    return {
      ...config.gameObjectDefaultValues.position,
      ...pluginData?.position,
      ...position
    }
  }
  return backupPosition
}

/**
 * Infers the sprite for the sprite game object.
 * @param layer - The Figma layer to infer sprite from.
 * @returns The inferred sprite for the sprite game object.
 */
export async function inferSpriteComponentSprite(layer: ExportableLayer) {
  if (isFigmaComponentInstance(layer)) {
    const mainComponent = await findMainFigmaComponent(layer);
    if (mainComponent) {
      const { parent } = mainComponent;
      if (!!parent && isLayerAtlas(parent)) {
        return resolveGameObjectSprite(parent, layer);
      }
    }
  }
  if (isFigmaSlice(layer)) {
    return resolveGameObjectImpliedSprite(layer);
  }
  return resolveGameObjectEmptySprite();
}

/**
 * Resolves the sprite for the sprite game object.
 * @param atlas - The atlas containing the sprite layer.
 * @param layer - The sprite layer to resolve sprite from.
 * @returns The resolved sprite for the sprite game object.
 */
function resolveGameObjectSprite(atlas: ComponentSetNode, layer: InstanceNode) {
  const atlasName = resolveAtlasName(atlas);
  const sprite = layer.variantProperties?.Sprite;
  return {
    image: sprite ? atlasName : "",
    default_animation: sprite ?? ""
  };
}

/**
 * Resolves the implied sprite for the sprite game object.
 * @param layer - The slice layer to resolve implied sprite from.
 * @returns The resolved implied sprite for the sprite game object.
 */
function resolveGameObjectImpliedSprite(layer: SliceLayer) {
  const { parent } = layer;
  const atlasName = parent ? parent.name : layer.name;
  return {
    image: atlasName,
    default_animation: layer.name
  };
}

/**
 * Resolves the empty sprite for the sprite game object.
 * @returns The resolved empty sprite for the sprite game object.
 */
function resolveGameObjectEmptySprite() {
  return {
    image: undefined,
    default_animation: undefined
  };
}
