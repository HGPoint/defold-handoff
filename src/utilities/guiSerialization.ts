/**
 * Handles GUI-related data serialization.
 * @packageDocumentation
 */

import { propertySerializer } from "utilities/dataSerialization";
import { indentLines } from "utilities/defold";
import { isGUITemplateType } from "utilities/gui";
import { generateTemplatePath } from "utilities/path";
import { extractScheme } from "utilities/scheme";

/**
 * An array containing keys of properties to be excluded during serialization.
 * @constant
 */
const EXCLUDED_PROPERTY_KEYS = [
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
const EXCLUDED_TEMPLATE_PROPERTY_KEYS = [
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
  const gui = Object.entries(guiData.gui).reduce(propertySerializer, "");
  const nodes = guiData.nodes.reduce(guiNodeSerializer, "");
  const textures = serializeGUITextureData(guiData.textures);
  const fonts = serializeGUIFontsData(guiData.fonts);
  const layers = serializeGUILayersData(guiData.layers);
  const data = `${gui}${textures}${fonts}${nodes}${layers}`.trim();
  const templateData = serializeTemplateData(guiData, asTemplate);
  const serializedData = {
    name,
    data,
    filePath,
    ...templateData
  };
  return Promise.resolve(serializedData);
}

/**
 * Reducer function that serializes GUI node data.
 * @param data - The cumulative serialized GUI node data.
 * @param guiNodeData - The GUI node data to be serialized.
 * @returns The updated cumulative serialized GUI node data.
 */
function guiNodeSerializer(data: string, guiNodeData: GUINodeData): string {
  if (isGUITemplateType(guiNodeData.type)) {
    const node = Object.entries(guiNodeData).reduce((serializedProperties: string, property) => {
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
    return `${data}nodes\n{\n${indentLines(node)}\n}\n`;
  } else {
    const node = Object.entries(guiNodeData).reduce((serializedProperties: string, property) => {
      const [ key ] = property; 
      if (EXCLUDED_PROPERTY_KEYS.includes(key)) {
        return serializedProperties;
      }
      return propertySerializer(serializedProperties, property);
    }, "");
    return `${data}nodes\n{\n${indentLines(node)}\n}\n`;
  }
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
  return `${data}textures\n{\n${indentLines(serializedTexture)}\n}\n`;
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
  return `${data}fonts\n{\n${indentLines(serializedFont)}\n}\n`;
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
