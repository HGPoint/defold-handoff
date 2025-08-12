/**
 * Handles GUI-related data conversion from Figma into Defold-like properties.
 * @packageDocumentation
 */

import config from "config/config.json";
import { PROJECT_CONFIG } from "handoff/project";
import { resolveBaseColor, splitColor } from "utilities/color";
import { generateContextData } from "utilities/context";
import { injectGUIDefaults, injectGUINodeDefaults } from "utilities/defaults";
import { getPluginData } from "utilities/figma";
import { inferBackgroundColor, inferClippingVisible, inferColor, inferFigmaPosition, inferFont, inferGUIBoxTexture, inferGUIBoxVisible, inferGUINodeType, inferGUITextSizeMode, inferGUITextVisible, inferLineBreak, inferRotation, inferScale, inferSize, inferSizeMode, inferSlice9, inferText, inferTextBoxSize, inferTextLeading, inferTextOutline, inferTextPivot, inferTextScale, inferTextShadow, inferTextTracking, resolveGUITextSpriteNodeImpliedSprite } from "utilities/inference";
import { divideVectorByValue, multiplyVectorByValue, readableVector, readableNumber, vector4 } from "utilities/math";
import { generateScriptPath } from "utilities/path";
import { calculateChildPosition, calculateRootPosition } from "utilities/pivot";

/**
 * Converts the GUI to a Defold-like structure.
 * @param rootData - The root plugin data of the GUI.
 * @returns The converted GUI data.
 */
export function convertGUIData(rootData?: WithNull<PluginGUINodeData>): GUIDefoldData {
  const script = resolveGUIScript(rootData);
  const backgroundColor = inferBackgroundColor();
  const defaults = injectGUIDefaults();
  return {
    ...defaults,
    script,
    background_color: backgroundColor,
  };
}

/**
 * Converts the box GUI node to a Defold-like structure.
 * @param layer - The Figma layer to convert.
 * @param options - The export options.
 * @returns The converted GUI node data.
 */
export async function convertBoxGUINodeData(layer: BoxLayer, options: GUINodeDataExportOptions): Promise<GUINodeData> {
  const context = generateContextData(layer);
  const defaults = injectGUINodeDefaults();
  const data = getPluginData(layer, "defoldGUINode");
  const id = convertGUINodeId(layer, context.ignorePrefixes, options)
  const slice9 = inferSlice9(layer, data);
  const type = convertGUINodeType(layer, options, data);
  const guiLayer = convertGUINodeLayer(context, data);
  const pivot = convertGUIBoxNodePivot(data);
  const visuals = await convertGUIBoxNodeVisuals(layer, data);
  const sizeMode = await convertGUIBoxNodeSizeMode(layer, data);
  const transformations = convertGUIBoxNodeTransformations(layer, pivot, options, data);
  const parent = convertGUINodeParent(options, data);
  const specialProperties = convertGUINodeSpecialProperties(layer, id, data);
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

export function convertImpliedBoxGUINodeData(layer: RectangleNode, options: GUINodeDataExportOptions): GUINodeData {
  const context = generateContextData(layer);
  const defaults = injectGUINodeDefaults();
  const data = getPluginData(layer, "defoldGUINode");
  const id = convertGUINodeId(layer, context.ignorePrefixes, options)
  const type = "TYPE_BOX";
  const visuals = convertGUIImpliedBoxNodeVisuals(layer);
  const sizeMode = "SIZE_MODE_MANUAL";
  const transformations = convertGUIImpliedBoxNodeTransformations(layer, "PIVOT_CENTER", options, data);
  const { parentId: parent } = options;
  const specialProperties = convertGUINodeSpecialProperties(layer, id, data);
  return {
    ...defaults,
    id,
    type,
    ...specialProperties,
    parent,
    ...transformations,
    ...visuals,
    size_mode: sizeMode,
    figma_node_type: layer.type,
    exportable_layer: layer,
    exportable_layer_id: layer.id,
    exportable_layer_name: layer.name,
  };
}

/**
 * Converts the text GUI node to a Defold-like structure.
 * @param layer - The Figma layer to convert.
 * @param options - The export options.
 * @returns The converted GUI node data.
 */
export function convertTextGUINodeData(layer: TextLayer, options: GUINodeDataExportOptions): GUINodeData {
  const context = generateContextData(layer);
  const defaults = injectGUINodeDefaults();
  const data = getPluginData(layer, "defoldGUINode");
  const id = convertGUINodeId(layer, context.ignorePrefixes, options)
  const type = convertGUINodeType(layer, options, data);
  const guiLayer = convertGUINodeLayer(context, data);
  const pivot = inferTextPivot(layer);
  const visuals = convertGUITextNodeVisuals(layer, data);
  const sizeMode = convertGUITextNodeSizeMode(data);
  const transformations = convertGUITextNodeTransformations(layer, pivot, options, data);
  const parent = convertGUINodeParent(options);
  const text = inferText(layer);
  const textParameters = convertGUITextNodeParameters(layer);
  const specialProperties = convertGUINodeSpecialProperties(layer, id, data);
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
  }
}

export async function convertTextSpriteGUINodeData(layer: TextLayer, options: GUINodeDataExportOptions): Promise<GUINodeData> {
  const context = generateContextData(layer);
  const defaults = injectGUINodeDefaults();
  const data = getPluginData(layer, "defoldGUINode");
  const id = convertGUINodeId(layer, context.ignorePrefixes, options)
  const slice9 = vector4(0);
  const type = "TYPE_BOX";
  const guiLayer = convertGUINodeLayer(context, data);
  const pivot = inferTextPivot(layer);
  const visuals = await convertGUITextSpriteNodeVisuals(layer);
  const sizeMode = "SIZE_MODE_MANUAL";
  const transformations = await convertGUITextSpriteNodeTransformations(layer, pivot, options, data);
  const parent = convertGUINodeParent(options, data);
  const specialProperties = convertGUINodeSpecialProperties(layer, id, data);
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
 * Converts the GUI node parent to a Defold-like data.
 * @param options
 * @param pluginData
 * @returns The converted GUI node parent data.
 */
function convertGUINodeParent(options: GUINodeDataExportOptions, pluginData?: WithNull<PluginGUINodeData>) {
  const { collapseTemplates, parentId } = options
  if (!collapseTemplates && pluginData?.cloneable) {
    return {};
  }
  return parentId ? { parent: parentId } : {};
}

/**
 * Resolves the script path for a GUI component.
 * @param pluginData - Root GUI node data.
 * @returns The resolved script path.
 */
function resolveGUIScript(pluginData?: WithNull<PluginGUINodeData>) {
  if (pluginData?.script) {
    return generateScriptPath(pluginData.script_path, pluginData.script_name);
  }
  return config.guiDefaultValues.script;
}

/**
 * Converts the GUI node ID to a Defold-like data.
 * @param layer - The Figma layer to convert ID for.
 * @param ignorePrefixes - Whether to ignore prefixes.
 * @param options
 * @returns The converted GUI node ID.
 */
function convertGUINodeId(layer: SceneNode, ignorePrefixes: boolean, options: GUINodeDataExportOptions) {
  const { forcedName, namePrefix, variantPrefix } = options
  const name = forcedName || layer.name;
  if (!ignorePrefixes) {
    return `${namePrefix || ""}${name}${variantPrefix ? `_${variantPrefix.toLowerCase()}` : ""}`;
  }
  return name;
}

/**
 * Converts the GUI node type to a Defold-like data.
 * @param layer - The Figma layer to convert type for.
 * @param options - The export options.
 * @param pluginData - The GUI node plugin data.
 * @param atRoot - Whether the layer is at the root level.
 * @returns The converted GUI node type.
 */
function convertGUINodeType(layer: ExportableLayer, options: GUINodeDataExportOptions, pluginData?: WithNull<PluginGUINodeData>): GUINodeType {
  if (pluginData?.template && (!options.atRoot || !options.asTemplate)) {
    return "TYPE_TEMPLATE";
  }
  if (options.textAsSprites) {
    return "TYPE_BOX";
  }
  return inferGUINodeType(layer);
}

/**
 * Converts the box GUI node transformations to a Defold-like data.
 * @param layer - The Figma layer to convert transformations for.
 * @param pivot - The pivot point of the layer.
 * @param options
 * @returns The converted box GUI node transformations.
 */
function convertGUIBoxNodeTransformations(layer: BoxLayer, pivot: Pivot, options: GUINodeDataExportOptions, pluginData?: WithNull<PluginGUINodeData>) {
  const size = convertGUINodeSize(layer, options, pluginData);
  const scale = convertGUINodeScale(layer, pluginData);
  const guiNodeTransformations = convertGUINodeTransformations(layer, pivot, size, options, pluginData);
  return {
    ...guiNodeTransformations,
    size,
    scale,
  };
}

function convertGUIImpliedBoxNodeTransformations(layer: RectangleNode, pivot: Pivot, options: GUINodeDataExportOptions, pluginData: WithNull<PluginGUINodeData>) {
  const size = convertGUINodeSize(layer, options, pluginData);
  const scale = convertGUINodeScale(layer, pluginData);
  const position = convertGUINodePosition(layer, pivot, size, options, pluginData);
  const figmaPosition = inferFigmaPosition(layer);
  const rotation = inferRotation(layer);
  return {
    size,
    scale,
    position,
    rotation,
    figma_position: figmaPosition,
  };
}

/**
 * Converts the text GUI node transformations to a Defold-like data.
 * @param layer - The Figma layer to convert transformations for.
 * @param pivot - The pivot point of the layer.
 * @param options
 * @param pluginData - The GUI node plugin data. 
 * @returns The converted text GUI node transformations.
 */
function convertGUITextNodeTransformations(layer: TextLayer, pivot: Pivot, options: GUINodeDataExportOptions, pluginData?: WithNull<PluginGUINodeData>) {
  const scale = convertGUITextNodeScale(layer, pluginData);
  const textBoxSize = convertGUINodeSize(layer, options, pluginData);
  const size = convertGUITextNodeSize(layer, scale, options, pluginData);
  const guiNodeTransformations = convertGUINodeTransformations(layer, pivot, textBoxSize, options, pluginData);
  return {
    ...guiNodeTransformations,
    size,
    scale,
  };
}

/**
 * Converts the GUI node base transformations to a Defold-like data.
 * @param layer - The Figma layer to convert base transformations for.
 * @param pivot - The pivot point of the layer.
 * @param size - The size of the layer.
 * @param options
 * @param pluginData - The GUI node plugin data.
 * @returns The converted GUI node base transformations.
 */
function convertGUINodeTransformations(layer: ExportableLayer, pivot: Pivot, size: Vector4, options: GUINodeDataExportOptions, pluginData?: WithNull<PluginGUINodeData>) {
  const figmaPosition = inferFigmaPosition(layer);
  const position = convertGUINodePosition(layer, pivot, size, options, pluginData);
  const rotation = inferRotation(layer);
  return {
    position,
    rotation,
    figma_position: figmaPosition,
  };
}

async function convertGUITextSpriteNodeTransformations(layer: TextLayer, pivot: Pivot, options: GUINodeDataExportOptions, pluginData?: WithNull<PluginGUINodeData>) {
  const size = convertGUINodeSize(layer, options, pluginData);
  const scale = convertGUINodeScale(layer, pluginData);
  const figmaPosition = inferFigmaPosition(layer);
  const position = convertGUINodePosition(layer, pivot, size, options, pluginData);
  const rotation = inferRotation(layer);
  return {
    position,
    size,
    scale,
    rotation,
    figma_position: figmaPosition,
  };
}

/**
 * Converts the box GUI node pivot point to a Defold-like data.
 * @param pluginData - The GUI node plugin data.
 * @returns The converted box GUI node pivot point.
 */
function convertGUIBoxNodePivot(pluginData?: WithNull<PluginGUINodeData>) {
  const pivot = pluginData?.pivot;
  if (pivot) {
    return pivot;
  }
  return config.guiNodeDefaultValues.pivot;
}

/**
 * Converts the GUI node position to a Defold-like data.
 * @param layer - The Figma layer to convert position for.
 * @param pivot - The pivot point of the layer.
 * @param parentPivot - The pivot point of the parent layer.
 * @param size - The size of the layer.
 * @param parentSize - The size of the parent layer.
 * @param parentShift - The position shift of the parent layer.
 * @param atRoot - Whether the layer is at the root level.
 * @param pluginData - The GUI node plugin data.
 * @returns The converted GUI node position.
 */
function convertGUINodePosition(layer: SceneNode, pivot: Pivot, size: Vector4, options: GUINodeDataExportOptions, pluginData?: WithNull<PluginGUINodeData>) {
  if (options.atRoot) {
    const position = calculateRootPosition(layer, pivot, size, options, pluginData);
    const readablePosition = readableVector(position);
    return readablePosition;
  }
  const position = calculateChildPosition(layer, pivot, size, options, pluginData);
  const readablePosition = readableVector(position);
  return readablePosition;
}

function convertGUINodeScale(layer: SceneNode, pluginData?: WithNull<PluginGUINodeData>) {
  const layerScale = inferScale(layer);
  const layerScaleFactor = pluginData?.scale_factor || config.guiNodeDefaultSpecialValues.scale_factor;
  const scale = multiplyVectorByValue(layerScale, layerScaleFactor);
  const convertedScale = vector4(readableNumber(scale.x), readableNumber(scale.y), 1, 1);
  return convertedScale;
}

function convertGUITextNodeScale(layer: TextNode, pluginData?: WithNull<PluginGUINodeData>): Vector4 {
  const layerScale = inferTextScale(layer);
  const layerScaleFactor = pluginData?.scale_factor || config.guiNodeDefaultSpecialValues.scale_factor;
  const scale = multiplyVectorByValue(layerScale, layerScaleFactor);
  const convertedScale = vector4(readableNumber(scale.x), readableNumber(scale.y), 1, 1);
  return convertedScale;
}

function convertGUINodeSize(layer: SceneNode, options: GUINodeDataExportOptions, pluginData?: WithNull<PluginGUINodeData>) {
  const { parentScale } = options
  const layerSize = inferSize(layer);
  const layerScaleFactor = pluginData?.scale_factor || config.guiNodeDefaultSpecialValues.scale_factor;
  const scaleFactor = parentScale * layerScaleFactor;
  const size = divideVectorByValue(layerSize, scaleFactor);
  return readableVector(size);
}

function convertGUITextNodeSize(layer: TextNode, scale: Vector4, options: GUINodeDataExportOptions, pluginData?: WithNull<PluginGUINodeData>): Vector4 {
  const { parentScale } = options
  const layerSize = inferTextBoxSize(layer, scale);
  const layerScaleFactor = pluginData?.scale_factor || config.guiNodeDefaultSpecialValues.scale_factor;
  const scaleFactor = parentScale * layerScaleFactor;
  const size = divideVectorByValue(layerSize, scaleFactor);
  return readableVector(size);
}

/**
 * Converts the box GUI node size mode to a Defold-like data.
 * @param layer - The Figma layer to convert size mode for.
 * @param texture - The box GUI node texture.
 * @param pluginData - The GUI node plugin data.
 * @returns The converted size mode.
 */
async function convertGUIBoxNodeSizeMode(layer: BoxLayer, pluginData?: WithNull<PluginGUINodeData>): Promise<SizeMode> {
  if (pluginData?.size_mode && Object.values(config.sizeModes).includes(pluginData.size_mode)) {
    return pluginData.size_mode;
  }
  return await inferSizeMode(layer);
}

/**
 * Converts the text GUI node size mode to a Defold-like data.
 * @param pluginData - The GUI node plugin data.
 * @returns The converted size mode.
 */
function convertGUITextNodeSizeMode(pluginData?: WithNull<PluginGUINodeData>) {
  if (pluginData?.size_mode && Object.values(config.sizeModes).includes(pluginData.size_mode)) {
    return pluginData.size_mode;
  }
  return inferGUITextSizeMode();
}

/**
 * Converts the box GUI node visuals to a Defold-like data.
 * @param layer - The Figma layer to convert visuals for.
 * @param pluginData - The GUI node plugin data.
 * @returns The converted visuals.
 */
async function convertGUIBoxNodeVisuals(layer: BoxLayer, pluginData?: WithNull<PluginGUINodeData>) {
  const color = inferColor(layer);
  const { colorHue, colorAlpha } = splitColor(color);
  const { textureName, textureSize } = await inferGUIBoxTexture(layer);
  const visible = convertGUIBoxNodeVisible(layer, textureName, pluginData);
  const clippingVisible = inferClippingVisible(layer);
  return {
    visible,
    color: colorHue,
    alpha: colorAlpha,
    texture: textureName,
    texture_size: textureSize,
    clipping_visible: clippingVisible,
  };
}

function convertGUIImpliedBoxNodeVisuals(layer: RectangleNode) {
  const color = inferColor(layer);
  const { colorHue, colorAlpha } = splitColor(color);
  const visible = true;
  const clippingVisible = true;
  return {
    visible,
    color: colorHue,
    alpha: colorAlpha,
    clipping_visible: clippingVisible,
  };
}

/**
 * Converts the text GUI node visuals to a Defold-like data.
 * @param layer - The Figma layer to convert visuals for.
 * @param pluginData - The GUI node plugin data.
 * @returns The converted visuals.
 */
function convertGUITextNodeVisuals(layer: TextLayer, pluginData?: WithNull<PluginGUINodeData>) {
  const color = inferColor(layer);
  const { colorHue, colorAlpha } = splitColor(color);
  const visible = convertGUITextNodeVisible(layer, pluginData);
  const font = convertGUITextNodeFont(layer, pluginData);
  const outline = inferTextOutline(layer);
  const { colorHue: outlineHue, colorAlpha: outlineAlpha } = splitColor(outline);
  const shadow = inferTextShadow(layer);
  const { colorHue: shadowHue, colorAlpha: shadowAlpha } = splitColor(shadow);
  return {
    visible,
    color: colorHue,
    alpha: colorAlpha,
    outline: outlineHue,
    outline_alpha: outlineAlpha,
    shadow: shadowHue,
    shadow_alpha: shadowAlpha,
    font
  };
}

async function convertGUITextSpriteNodeVisuals(layer: TextLayer) {
  const color = resolveBaseColor();
  const { colorHue, colorAlpha } = splitColor(color);
  const { textureName, textureSize } = await resolveGUITextSpriteNodeImpliedSprite(layer);
  const visible = true;
  const clippingVisible = false;
  return {
    visible,
    color: colorHue,
    alpha: colorAlpha,
    texture: textureName,
    texture_size: textureSize,
    clipping_visible: clippingVisible,
  };
}

/**
 * Converts the box GUI node visibility to a Defold-like data.
 * @param layer - The Figma layer to convert visibility for.
 * @param texture - The box GUI node texture.
 * @param pluginData - The GUI node plugin data.
 * @returns The converted visibility.
 */
function convertGUIBoxNodeVisible(layer: BoxLayer, texture?: string, pluginData?: WithNull<PluginGUINodeData>) {
  if (pluginData?.visible !== undefined) {
    return pluginData.visible;
  }
  return inferGUIBoxVisible(layer, texture);
}

/**
 * Converts the text GUI node visibility to a Defold-like data.
 * @param layer - The Figma layer to convert visibility for.
 * @param pluginData - The GUI node plugin data.
 * @returns The converted visibility.
 */
function convertGUITextNodeVisible(layer: TextLayer, pluginData?: WithNull<PluginGUINodeData>) {
  if (pluginData?.visible !== undefined) {
    return pluginData.visible;
  }
  return inferGUITextVisible();
}

/**
 * Converts the GUI node layer to a Defold-like data.
 * @param context - The context data to convert the layer names from.
 * @param pluginData - The GUI node plugin data.
 * @returns The converted layer name.
 */
function convertGUINodeLayer(context: PluginContextData, pluginData?: WithNull<PluginGUINodeData>) {
  if (pluginData?.layer) {
    if (pluginData.layer.toUpperCase() === "DEFAULT") {
      return "";
    }
    const layerData = context.layers.find(guiLayer => guiLayer.id === pluginData.layer);
    if (layerData) {
      return layerData.name;
    }
  }
  return "";
}

/**
 * Converts the GUI node font to a Defold-like data.
 * @param layer - The Figma layer to convert font for.
 * @param pluginData - The GUI node plugin data.
 * @returns The converted font.
 */
export function convertGUITextNodeFont(layer: TextLayer, pluginData?: WithNull<PluginGUINodeData>) {
  if (pluginData?.font) {
    const fontData = PROJECT_CONFIG.fontFamilies.find(fontFamily => fontFamily.id === pluginData.font);
    if (fontData) {
      return fontData.name;
    }
  }
  const inferredFont = inferFont(layer);
  if (inferredFont) {
    const inferredFontData = PROJECT_CONFIG.fontFamilies.find(fontFamily => fontFamily.id === inferredFont);
    if (inferredFontData) {
      return inferredFontData.name;
    }
  }
  return "";
}

/**
 * Converts the GUI node text properties to a Defold-like data.
 * @param layer - The Figma layer to convert text properties for.
 * @returns The converted text properties.
 */
function convertGUITextNodeParameters(layer: TextLayer) {
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
 * Converts the GUI node special properties to a Defold-like data.
 * @param layer - The Figma layer to convert special properties for.
 * @param id - The ID of the layer.
 * @param pluginData - The GUI node plugin data.
 * @returns The converted special properties.
 */
function convertGUINodeSpecialProperties(layer: ExportableLayer | RectangleNode, id: string, pluginData?: WithNull<PluginGUINodeData>) {
  return {
    screen: !!pluginData?.screen,
    skip: !!pluginData?.skip,
    cloneable: !!pluginData?.cloneable,
    fixed: !!pluginData?.fixed,
    path: pluginData?.path || config.guiNodeDefaultSpecialValues.path,
    template: !!pluginData?.template,
    template_path: pluginData?.template && pluginData?.template_path ? pluginData.template_path : config.guiNodeDefaultSpecialValues.template_path,
    template_name: pluginData?.template && pluginData?.template_name ? pluginData.template_name : id,
    script: !!pluginData?.script || false,
    script_path: pluginData?.script && pluginData?.script_path ? pluginData.script_path : config.guiNodeDefaultSpecialValues.script_path,
    script_name: pluginData?.script && pluginData?.script_name ? pluginData.script_name : id,
    wrapper: !!pluginData?.wrapper,
    wrapper_padding: pluginData?.wrapper_padding || vector4(0),
    exclude: !!pluginData?.exclude,
    inferred: !!pluginData?.inferred,
    figma_node_type: layer.type,
    exportable_layer: layer,
    exportable_layer_id: layer.id,
    exportable_layer_name: layer.name,
    export_variants: pluginData?.export_variants || "",
  };
}
