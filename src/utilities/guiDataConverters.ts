/**
 * Utility module for handling GUI node data conversion.
 * @packageDocumentation
 */

import config from "config/config.json";
import { projectConfig } from "handoff/project";
import { generateContextData } from "utilities/context";
import { generateScriptPath } from "utilities/path";
import { isFigmaText, getPluginData } from "utilities/figma";
import { vector4 } from "utilities/math";
import { calculateChildPosition, calculateRootPosition } from "utilities/pivot";
import { inferTextScale, inferScale, inferRotation, inferSize, inferTextBoxSize, inferSlice9, inferBoxSizeMode, inferGUITextNodeSizeMode, inferTextPivot, inferGUIBoxNodeVisible, inferGUITextVisible, inferGUIBoxNodeTexture, inferText, inferFont, inferColor, inferTextOutline, inferTextShadow, inferLineBreak, inferTextLeading, inferTextTracking, inferClippingVisible, inferBackgroundColor } from "utilities/inference";

/**
 * Generates the ID for a given layer, optionally with a forced name and name prefix.
 * @param layer - The Figma layer for which to resolve the ID.
 * @param forcedName - A forced name for the ID.
 * @param namePrefix - A prefix to prepend to the ID.
 * @param ignorePrefixes - Indicates whether to ignore prefixes.
 * @returns The generated ID for the layer.
 */
function convertGUINodeId(layer: ExportableLayer, ignorePrefixes: boolean, forcedName?: string, namePrefix?: string, variantPrefix?: string) {
  const name = forcedName || layer.name;
  if (!ignorePrefixes) {
    return `${namePrefix || ""}${name}${variantPrefix ? `_${variantPrefix.toLowerCase()}` : ""}`;
  }
  return name;
}

/**
 * Resolves type for a given layer based on its type and plugin data.
 * @param layer - The Figma layer to resolve the type for.
 * @param options - The GUI node data export options.
 * @param data - The plugin data associated with the layer.
 * @param atRoot - Indicates whether the layer is at the root level.
 * @returns The resolved type for the layer.
 */
function convertGUINodeType(layer: ExportableLayer, options: GUINodeDataExportOptions, data?: PluginGUINodeData | null, atRoot?: boolean): GUINodeType {
  if (data?.template && (!atRoot || !options.asTemplate)) {
    return "TYPE_TEMPLATE";
  } else if (isFigmaText(layer)) {
    return "TYPE_TEXT";
  }
  return "TYPE_BOX";
}

function convertGUINodeParent(parentId?: string, data?: PluginGUINodeData | null) {
  if (data?.cloneable) {
    return {};
  }
  return parentId ? { parent: parentId } : {};
}

/**
 * Resolve the pivot point for a Figma layer.
 * @param data - GUI node data.
 * @returns The resolved pivot point for the Figma layer.
 */
function convertGUIBoxNodePivot(data?: PluginGUINodeData | null) {
  const pivot = data?.pivot;
  if (pivot) {
    return pivot;
  }
  return config.guiNodeDefaultValues.pivot;
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
function convertGUINodePosition(layer: ExportableLayer, pivot: Pivot, parentPivot: Pivot, size: Vector4, parentSize: Vector4, parentShift: Vector4, atRoot: boolean, asTemplate: boolean, data?: PluginGUINodeData | null) {
  if (atRoot) {
    return calculateRootPosition(layer, pivot, parentPivot, size, parentSize, parentShift, asTemplate, data);
  }
  return calculateChildPosition(layer, pivot, parentPivot, size, parentSize, parentShift, asTemplate, data);
}

/**
 * Resolves the size mode for a Figma layer.
 * @param layer - The Figma layer to resolve size mode for.
 * @param texture - The texture associated with the layer.
 * @param data - GUI node data.
 * @returns The resolved size mode for the Figma layer.
 */
async function convertGUIBoxNodeSizeMode(layer: BoxLayer, texture?: string, data?: PluginGUINodeData | null): Promise<SizeMode> {
  if (data?.size_mode && data.size_mode !== "PARSED") {
    return data.size_mode;
  }
  return await inferBoxSizeMode(layer, texture);
}

/**
 * Resolves the size mode for a text layer.
 * @param data - GUI node data.
 * @returns The resolved size mode for the text layer.
 */
function convertGUITextNodeSizeMode(data?: PluginGUINodeData | null) {
  if (data?.size_mode && data.size_mode !== "PARSED") {
    return data.size_mode;
  }
  return inferGUITextNodeSizeMode();
}

/**
 * Resolves the visibility of a Figma layer.
 * @param layer - The Figma layer to resolve visibility for.
 * @param texture - The texture associated with the layer.
 * @param data - GUI node data.
 * @returns The resolved visibility for the Figma layer.
 */
function convertGUIBoxNodeVisible(layer: BoxLayer, texture?: string, data?: PluginGUINodeData | null) {
  if (data?.visible !== undefined) {
    return data.visible;
  }
  return inferGUIBoxNodeVisible(layer, texture);
}

/**
 * Resolves the visibility of a text layer.
 * @param layer - The text layer to resolve visibility for.
 * @param data - GUI node data.
 * @returns The resolved visibility for the text layer.
 */
function convertGUITextNodeVisible(layer: TextLayer, data?: PluginGUINodeData | null) {
  if (data?.visible !== undefined) {
    return data.visible;
  }
  return inferGUITextVisible();
}

/**
 * Resolves the layer for a GUI node.
 * @param context - The GUI context data.
 * @param data - The GUI node data.
 * @returns The resolved layer for the GUI node.
 */
function convertGUINodeLayer(context: PluginGUIContextData, data?: PluginGUINodeData | null) {
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
 * Resolves the font for a text layer.
 * @param layer - The text layer to resolve font for.
 * @param data - PluginGUINodeData object containing additional data.
 * @returns The resolved font for the text layer.
 */
export function convertGUITextNodeFont(layer: TextLayer, data?: PluginGUINodeData | null) {
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
 * Resolves properties related to text layout.
 * @param layer - The text layer to resolve properties for.
 * @returns Resolved text properties of the text layer.
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
function convertGUINodeTransformations(layer: ExportableLayer, pivot: Pivot, parentPivot: Pivot, size: Vector4, parentSize: Vector4, parentShift: Vector4, atRoot: boolean, asTemplate: boolean, data?: PluginGUINodeData | null) {
  const figmaPosition = vector4(layer.x, layer.y, 0, 1);
  const position = convertGUINodePosition(layer, pivot, parentPivot, size, parentSize, parentShift, atRoot, asTemplate, data);
  const rotation = inferRotation(layer);
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
function convertGUIBoxNodeTransformations(layer: BoxLayer, pivot: Pivot, parentPivot: Pivot, parentSize: Vector4, parentShift: Vector4, atRoot: boolean, asTemplate: boolean, data?: PluginGUINodeData | null) {
  const size = inferSize(layer);
  const scale = inferScale();
  const guiNodeTransformations = convertGUINodeTransformations(layer, pivot, parentPivot, size, parentSize, parentShift, atRoot, asTemplate, data);
  return {
    ...guiNodeTransformations,
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
function convertGUITextNodeTransformations(layer: TextLayer, pivot: Pivot, parentPivot: Pivot, parentSize: Vector4, parentShift: Vector4, atRoot: boolean, asTemplate: boolean, data?: PluginGUINodeData | null) {
  const scale = inferTextScale(layer);
  const textBoxSize = inferSize(layer);
  const size = inferTextBoxSize(layer, scale);
  const guiNodeTransformations = convertGUINodeTransformations(layer, pivot, parentPivot, textBoxSize, parentSize, parentShift, atRoot, asTemplate, data);
  return {
    ...guiNodeTransformations,
    size,
    scale,
  };
}

/**
 * Converts the visual properties of a Figma layer.
 * @param layer - The Figma layer to convert visual properties for.
 * @param data - GUI node data.
 * @returns The converted visual properties of the Figma layer.
 */
async function convertGUIBoxNodeVisuals(layer: BoxLayer, data?: PluginGUINodeData | null) {
  const color = inferColor(layer);
  const texture = await inferGUIBoxNodeTexture(layer);
  const visible = convertGUIBoxNodeVisible(layer, texture, data);
  const clippingVisible = inferClippingVisible(layer);
  return {
    visible,
    color,
    texture,
    clipping_visible: clippingVisible,
  };
}

/**
 * Converts the visual properties of a text layer.
 * @param layer - The text layer to convert visual properties for.
 * @param data - GUI node data.
 * @returns The converted visual properties of the text layer.
 */
function convertGUITextNodeVisuals(layer: TextLayer, data?: PluginGUINodeData | null) {
  const color = inferColor(layer);
  const visible = convertGUITextNodeVisible(layer, data);
  const font = convertGUITextNodeFont(layer, data);
  const outline = inferTextOutline(layer);
  const shadow = inferTextShadow(layer);
  return {
    visible,
    color,
    outline,
    shadow,
    font
  };
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
 * @param layer - The layer to resolve special properties for.
 * @param id - The ID of the layer.
 * @param data - GUI node data.
 * @returns Special properties of the layer.
 */
function convertGUINodeSpecialProperties(layer: ExportableLayer, id: string, data?: PluginGUINodeData | null) {
  return {
    screen: !!data?.screen,
    skip: !!data?.skip,
    cloneable: !!data?.cloneable,
    fixed: !!data?.fixed,
    path: data?.path || config.guiNodeDefaultSpecialValues.path,
    template: !!data?.template,
    template_path: data?.template && data?.template_path ? data.template_path : config.guiNodeDefaultSpecialValues.template_path,
    template_name: data?.template && data?.template_name ? data.template_name : id,
    script: !!data?.script,
    script_path: data?.script && data?.script_path ? data.script_path : config.guiNodeDefaultSpecialValues.script_path,
    script_name: data?.script && data?.script_name ? data.script_name : id,
    wrapper: !!data?.wrapper,
    wrapper_padding: data?.wrapper_padding || vector4(0),
    exclude: !!data?.exclude,
    inferred: !!data?.inferred,
    exportable_layer: layer,
    exportable_layer_id: layer.id,
    exportable_layer_name: layer.name,
    export_variants: data?.export_variants || "",
  };
}

/**
 * Converts a Figma layer into GUI node data.
 * @param layer - The Figma layer to convert into GUI node data.
 * @param options - Options for exporting GUI node data.
 * @returns Converted GUI node data.
 */
export async function convertBoxGUINodeData(layer: BoxLayer, options: GUINodeDataExportOptions): Promise<GUINodeData> {
  const { namePrefix, variantPrefix, forcedName, parentId, parentPivot, parentSize, parentShift, atRoot, asTemplate } = options;
  const context = generateContextData(layer);
  const defaults = injectGUINodeDefaults();
  const data = getPluginData(layer, "defoldGUINode");
  const id = convertGUINodeId(layer, context.ignorePrefixes, forcedName, namePrefix, variantPrefix)
  const slice9 = inferSlice9(layer, data);
  const type = convertGUINodeType(layer, options, data, atRoot);
  const guiLayer = convertGUINodeLayer(context, data);
  const pivot = convertGUIBoxNodePivot(data);
  const visuals = await convertGUIBoxNodeVisuals(layer, data);
  const sizeMode = await convertGUIBoxNodeSizeMode(layer, visuals.texture, data);
  const transformations = convertGUIBoxNodeTransformations(layer, pivot, parentPivot, parentSize, parentShift, atRoot, asTemplate, data);
  const parent = convertGUINodeParent(parentId, data);
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
 * Converts a text layer into GUI node data.
 * @param layer - The text layer to convert into GUI node data.
 * @param options - Options for exporting GUI node data.
 * @returns Converted GUI node data.
 */
export function convertTextGUINodeData(layer: TextLayer, options: GUINodeDataExportOptions): GUINodeData {
  const { namePrefix, variantPrefix, forcedName, parentId, parentPivot, parentSize, parentShift, atRoot, asTemplate } = options;
  const context = generateContextData(layer);
  const defaults = injectGUINodeDefaults();
  const data = getPluginData(layer, "defoldGUINode");
  const id = convertGUINodeId(layer, context.ignorePrefixes, forcedName, namePrefix, variantPrefix)
  const type = convertGUINodeType(layer, options, data, atRoot);
  const guiLayer = convertGUINodeLayer(context, data);
  const pivot = inferTextPivot(layer);
  const visuals = convertGUITextNodeVisuals(layer, data);
  const sizeMode = convertGUITextNodeSizeMode(data);
  const transformations = convertGUITextNodeTransformations(layer, pivot, parentPivot, parentSize, parentShift, atRoot, asTemplate, data);
  const parent = convertGUINodeParent(parentId);
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
  };
}

/**
 * Injects default GUI component values.
 * @returns Default GUI component values.
 */
function injectGUIDefaults() {
  return {
    ...config.guiDefaultValues
  };
}

/**
 * Resolves the script path for a GUI component.
 * @param data - Root GUI node data.
 * @returns The resolved script path.
 */
function convertGUIScript(data: PluginGUINodeData | null | undefined) {
  if (data?.script) {
    return generateScriptPath(data.script_path, data.script_name);
  }
  return config.guiDefaultValues.script;
}

/**
 * Converts GUI component data.
 * @returns Converted GUI component data.
 */
export function convertGUIData(rootData: PluginGUINodeData | null | undefined): GUIComponentData {
  const script = convertGUIScript(rootData);
  const backgroundColor = inferBackgroundColor();
  const defaults = injectGUIDefaults();
  return {
    ...defaults,
    script,
    background_color: backgroundColor,
  };
}