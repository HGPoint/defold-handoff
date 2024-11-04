/**
 * Utility module for handling GUI node data serialization.
 * @packageDocumentation
 */

import { propertySerializer } from "utilities/dataSerializers";
import { isGUITemplateNodeType } from "utilities/gui";
import { generateTemplatePath } from "utilities/path";

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
 * Serializes GUI node data.
 * @param {string} data - Serialized data.
 * @param {GUINodeData} guiNodeData - GUI node data to be serialized.
 * @returns {string} Serialized GUI node data.
 */
function guiNodeSerializer(data: string, guiNodeData: GUINodeData): string {
  if (isGUITemplateNodeType(guiNodeData.type)) {
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
    return `${data}\nnodes\n{\n${node}}`;
  } else {
    const node = Object.entries(guiNodeData).reduce((serializedProperties: string, property) => {
      const [ key ] = property; 
      if (EXCLUDED_PROPERTY_KEYS.includes(key)) {
        return serializedProperties;
      }
      return propertySerializer(serializedProperties, property);
    }, "");
    return `${data}\nnodes\n{\n${node}}`;
  }
}

/**
 * Serializes texture data.
 * @param data - Serialized data.
 * @param name - Name of the texture.
 * @param texture - Texture data.
 * @returns Serialized texture data.
 */
function textureDataSerializer(data: string, [name, texture]: [string, TextureAtlasData | TextureDynamicAtlasData]): string {
  return `${data}\ntextures\n{\nname:"${name}"\ntexture:"${texture.path}"\n}`;
}

/**
 * Serializes font data.
 * @param data - Serialized data.
 * @param name - Name of the font.
 * @param fontPath - Path to the font.
 * @returns Serialized font data.
 */
function fontsDataSerializer(data: string, [name, fontPath]: [string, string]): string {
  return `${data}\nfonts\n{\nname:"${name}"\nfont:"${fontPath}"\n}`;
}

/**
 * Serializes layer data.
 * @param data - Serialized data.
 * @param layer - Layer name.
 * @returns Serialized layer data.
 */
function layerDataSerializer(data: string, layer: string): string {
  return `${data}\nlayers\n{\nname:"${layer}"\n}`;
}

/**
 * Serializes template data.
 * @param guiData - GUI data.
 * @param asTemplate - Whether the GUI node should be serialized as a template.
 * @returns Serialized template data.
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

/**
 * Serializes GUI node data.
 * @param guiData - GUI node data to be serialized.
 * @returns Serialized GUI node data.
 */
export function serializeGUIData(guiData: GUIData): SerializedGUIData {
  const { name, asTemplate, filePath } = guiData;
  const gui = Object.entries(guiData.gui).reduce(propertySerializer, "");
  const nodes = guiData.nodes.reduce(guiNodeSerializer, "");
  const textures = Object.entries(guiData.textures).reduce(textureDataSerializer, "")
  const fonts = Object.entries(guiData.fonts).reduce(fontsDataSerializer, "");
  const layers = guiData.layers.reduce(layerDataSerializer, "");
  const data = `${gui}${textures}${fonts}${nodes}${layers}`;
  const templateData = serializeTemplateData(guiData, asTemplate);
  return {
    name,
    data,
    filePath,
    ...templateData
  };
}

/**
 * Serializes an array of GUI node data.
 * @param guiDataSet - Array of GUI node data to be serialized.
 * @returns Array of serialized GUI node data.
 */
export function serializeGUIDataSet(guiDataSet: GUIData[]): SerializedGUIData[] {
  return guiDataSet.map(serializeGUIData);
}
