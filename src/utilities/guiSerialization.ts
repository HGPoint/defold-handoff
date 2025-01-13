/**
 * Handles GUI-related data serialization.
 * @packageDocumentation
 */

import { PROJECT_CONFIG } from "handoff/project";
import { propertySerializer } from "utilities/dataSerialization";
import { indentLines } from "utilities/defold";
import { isGUITemplateType } from "utilities/gui";
import { areVectorsEqual, isVector4 } from "utilities/math";
import { generateTemplatePath } from "utilities/path";
import { extractScheme } from "utilities/scheme";

const GUI_NODE_PROPERTY_ORDER: (keyof GUINodeData)[] = [
  "position",
  "rotation",
  "scale",
  "size",
  "color",
  "type",
  "blend_mode",
  "text",
  "font",
  "texture",
  "id",
  "parent",
  "xanchor",
  "yanchor",
  "pivot",
  "outline",
  "shadow",
  "adjust_mode",
  "line_break",
  "layer",
  "inherit_alpha",
  "outline_alpha",
  "shadow_alpha",
  "text_leading",
  "text_tracking",
  "slice9",
  "clipping_mode",
  "clipping_visible",
  "clipping_inverted",
  "alpha",
  "enabled",
  "visible",
]

/**
 * An array containing keys of properties to be excluded during serialization.
 * @constant
 */
const EXCLUDED_PROPERTY_KEYS: (keyof GUINodeData)[] = [
  "exclude",
  "screen",
  "skip",
  "fixed",
  "cloneable",
  "export_variants",
  "path",
  "template",
  "template_path",
  "template_name",
  "script",
  "script_path",
  "script_name",
  "wrapper",
  "wrapper_padding",
  "inferred",
  "exportable_layer",
  "exportable_layer_id",
  "exportable_layer_name",
  "figma_position",
  "figma_node_type",
  "children"
];

/**
 * An array containing keys of properties to be excluded during template serialization.
 * @constant
 */
const EXCLUDED_TEMPLATE_PROPERTY_KEYS: (keyof GUINodeData)[] = [
  "visible",
  "text",
  "font",
  "outline",
  "shadow",
  "texture",
  "size_mode",
  "slice9",
  "material",
  "xanchor",
  "yanchor",
  "pivot",
  "adjust_mode",
  "clipping_mode",
  "clipping_visible",
  "clipping_inverted",
  "blend_mode",
  "custom_type",
  ...EXCLUDED_PROPERTY_KEYS,
];

/**
 * Serializes the GUI node data as a scheme.
 * @param guiData - GUI node data to be serialized.
 * @returns The serialized GUI node data as a scheme.
 */
export function serializeGUISchemeData(guiData: GUIData): Promise<SerializedGUISchemeData> {
  const { name } = guiData;
  const data = extractScheme(guiData.nodes);
  const serializedData = {
    name,
    data,
  };
  return Promise.resolve(serializedData);
}

/**
 * Serializes the GUI node data.
 * @param guiData - GUI node data to be serialized.
 * @returns The serialized GUI node data.
 */
export async function serializeGUIData(guiData: GUIData): Promise<SerializedGUIData> {
  const { name, asTemplate, filePath } = guiData;
  const gui = serializeGUIDefoldData(guiData.gui);
  const nodes = guiData.nodes.reduce(guiNodeSerializer, "");
  const textures = serializeGUITextureData(guiData.textures);
  const fonts = serializeGUIFontsData(guiData.fonts);
  const layers = serializeGUILayersData(guiData.layers);
  const data = `${gui.replace("<data>\n", `${textures}${fonts}${nodes}${layers}`)}`.trim();
  const templateData = serializeTemplateData(guiData, asTemplate);
  const serializedData = {
    name,
    data,
    filePath,
    ...templateData
  };
  return Promise.resolve(serializedData);
}

function serializeGUIDefoldData(guiData: GUIDefoldData): string {
  const properties = Object.entries(guiData) as [keyof GUIDefoldData, GUIDefoldData[keyof GUIDefoldData]][];
  const data = properties.reduce((serializedProperties: string, property) => {
    if (shouldOmitGUIProperty(property)) {
      return serializedProperties;
    }
    const [ key ] = property;
    if (key === "script") {
      serializedProperties = propertySerializer(serializedProperties, property);
      serializedProperties += `<data>\n`
      return serializedProperties;
    }
    return propertySerializer(serializedProperties, property);
  }, "");
  return data;
}

function shouldOmitGUIProperty<GUIDefoldData>(property: [keyof GUIDefoldData, GUIDefoldData[keyof GUIDefoldData]]): boolean {
  if (PROJECT_CONFIG.omitDefaultValues) {
    return isGUIPropertyDefaultValue(property);
  }
  return false;
}

function isGUIPropertyDefaultValue<GUIDefoldData>([key, value]: [keyof GUIDefoldData, GUIDefoldData[keyof GUIDefoldData]]): boolean {
  if (isVector4(value)) {
    if (key === "background_color") {
      return areVectorsEqual(value, { x: 0, y: 0, z: 0, w: 0 });
    }
  }
  if (typeof value === "number") {
    if (key === "max_nodes") {
      return value === 512;
    }
  }
  return false;
}

/**
 * Reducer function that serializes GUI node data.
 * @param data - The cumulative serialized GUI node data.
 * @param guiNodeData - The GUI node data to be serialized.
 * @returns The updated cumulative serialized GUI node data.
 */
function guiNodeSerializer(data: string, guiNodeData: GUINodeData): string {
  if (isGUITemplateType(guiNodeData.type)) {
    const properties = Object.entries(guiNodeData) as [keyof GUINodeData, GUINodeData[keyof GUINodeData]][];
    const node = properties.reduce((serializedProperties: string, property) => {
      const [ key ] = property; 
      if (key === "template") {
        const templatePath = generateTemplatePath(guiNodeData.template_path, guiNodeData.template_name);
        const template = `template:"${templatePath}"`
        return `${serializedProperties}${template}\n`;
      } else if (EXCLUDED_TEMPLATE_PROPERTY_KEYS.includes(key)) {
        return serializedProperties;
      }
      return propertySerializer(serializedProperties, property);
    }, "");
    return `${data}nodes {\n${indentLines(node)}\n}\n`;
  } else {
    const completeKeys = Object.keys(guiNodeData) as (keyof GUINodeData)[];
    completeKeys.sort(orderGUINodeProperties);
    const node = completeKeys.reduce((serializedProperties: string, key) => {
      const property: [keyof GUINodeData, GUINodeData[keyof GUINodeData]] = [key, guiNodeData[key]];
      if (shouldOmitGUINodeProperty(property)) {
        return serializedProperties;
      }
      return propertySerializer(serializedProperties, property);
    }, "");
    return `${data}nodes {\n${indentLines(node)}\n}\n`;
  }
}

function shouldOmitGUINodeProperty(property: [keyof GUINodeData, GUINodeData[keyof GUINodeData]]): boolean {
  const [ key ] = property;
  if (EXCLUDED_PROPERTY_KEYS.includes(key)) {
    return true;
  }
  if (PROJECT_CONFIG.omitDefaultValues) {
    return isGUINodePropertyDefaultValue(property);
  }
  return false;
}

function isGUINodePropertyDefaultValue([key, value]: [keyof GUINodeData, GUINodeData[keyof GUINodeData]]): boolean {
  if (key === "size_mode") {
    return value === "SIZE_MODE_MANUAL"; 
  }
  if (key === "pivot") {
    return value === "PIVOT_CENTER";
  }
  if (key === "adjust_mode") {
    return value === "ADJUST_MODE_FIT";
  }
  if (key === "clipping_mode") {
    return value === "CLIPPING_MODE_NONE";
  }
  if (key === "blend_mode") {
    return value === "BLEND_MODE_ALPHA";
  }
  if (key === "xanchor") {
    return value === "XANCHOR_NONE";
  }
  if (key === "yanchor") {
    return value === "YANCHOR_NONE";
  }
  if (isVector4(value)) {
    if (key === "scale" || key === "color") {
      return areVectorsEqual(value, { x: 1, y: 1, z: 1, w: 1 })
    }
    if (key === "position" || key === "rotation" || key === "size" || key === "slice9") {
      return areVectorsEqual(value, { x: 0, y: 0, z: 0, w: 0 });
    }
    if (key === "outline" || key === "shadow") {
      return areVectorsEqual(value, { x: 0, y: 0, z: 0, w: 0 });
    }
  }
  if (typeof value === "string") {
    return value === "";
  }
  if (typeof value === "number") {
    if (key === "text_leading" || key === "outline_alpha" || key === "shadow_alpha" || key === "alpha") {
      return value === 1;
    }
    if (key === "text_tracking" || key === "custom_type") {
      return value === 0;
    }
  }
  if (typeof value === "boolean") {
    if (key === "visible" || key === "enabled" || key === "clipping_visible") {
      return value === true;
    }
    if (key === "inherit_alpha" || key === "clipping_inverted" || key === "line_break" || key === "template_node_child") {
      return value === false;
    }
  }
  return false;
}

/**
 * Serializes the texture data.
 * @param textureData - The texture data to be serialized.
 * @returns The serialized texture data.
 */
function serializeGUITextureData(textureData?: TextureData) {
  if (textureData) {
    const data = Object.entries(textureData).reduce(textureDataSerializer, "")
    return data;
  }
  return "";
}

/**
 * Reducer function that serializes texture data.
 * @param data - The cumulative serialized texture data.
 * @param name - The name of the texture.
 * @param texture - The texture data to be serialized.
 * @returns The updated cumulative serialized texture data.
 */

function textureDataSerializer(data: string, [name, texture]: [string, TextureAtlasData]): string {
  const serializedTexture = `name: "${name}"\ntexture: "${texture.path}"`;
  return `${data}textures {\n${indentLines(serializedTexture)}\n}\n`;
}

/**
 * Serializes the font data.
 * @param fontData - The font data to be serialized.
 * @returns The serialized font data.
 */
function serializeGUIFontsData(fontData?: FontData) {
  if (fontData) {
    const data = Object.entries(fontData).reduce(fontsDataSerializer, "")
    return data;
  }
  return "";
}

/**
 * Reducer function that serializes font data.
 * @param data - The cumulative serialized font data.
 * @param name - The name of the font.
 * @param fontPath - The path to the font.
 * @returns The updated cumulative serialized font data.
 */
function fontsDataSerializer(data: string, [name, fontPath]: [string, string]): string {
  const serializedFont = `name: "${name}"\nfont: "${fontPath}"`;
  return `${data}fonts {\n${indentLines(serializedFont)}\n}\n`;
}

/**
 * Serializes the layer data.
 * @param layerData - The layer data to be serialized.
 * @returns The serialized layer data.
 */
function serializeGUILayersData(layerData?: LayerData) {
  if (layerData) {
    const data = layerData.reduce(layerDataSerializer, "");
    return data;
  }
  return "";
}

/**
 * Reducer function that serializes layer data.
 * @param data - The cumulative serialized layer data.
 * @param layer - The layer name.
 * @returns The updated cumulative serialized layer data.
 */
function layerDataSerializer(data: string, layer: string): string {
  const serializedLayer = `name: "${layer}"`;
  return `${data}layers\n{\n${indentLines(serializedLayer)}\n}\n`;
}

/**
 * Serializes the template data.
 * @param guiData - The GUI data to be serialized.
 * @param asTemplate - Whether the GUI node should be serialized as a template.
 * @returns The serialized template data.
 */
function serializeTemplateData(guiData: GUIData, asTemplate: boolean) {
  if (asTemplate) {
    return {
      template: true,
      templateName: guiData.nodes[0].template_name,
      templatePath: guiData.nodes[0].template_path,
    }
  }
  return {};
}

function orderGUINodeProperties(key1: keyof GUINodeData, key2: keyof GUINodeData) {
  const index1 = GUI_NODE_PROPERTY_ORDER.indexOf(key1);
  const index2 = GUI_NODE_PROPERTY_ORDER.indexOf(key2);
  if (index1 === -1 && index2 === -1) {
    return 0;
  }
  if (index1 === -1) {
    return 1;
  }
  if (index2 == -1) {
    return -1;
  }
  return index1 - index2;
}