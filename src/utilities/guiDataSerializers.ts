/**
 * Utility module for handling GUI node data serialization.
 * @packageDocumentation
 */

import { propertySerializer } from "utilities/dataSerializers";
import { isTemplateGUINodeType } from "utilities/gui";
import { generateTemplatePath } from "utilities/path";

/**
 * An array containing keys of properties to be excluded during serialization.
 * @constant
 */
const EXCLUDED_PROPERTY_KEYS = [
  "screen",
  "skip",
  "cloneable",
  "template",
  "template_path",
  "template_name",
  "wrapper",
  "wrapper_padding",
  "exportable_layer",
  "figma_position",
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
  if (isTemplateGUINodeType(guiNodeData.type)) {
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

function textureDataSerializer(data: string, [name, texture]: [string, TextureAtlasData]): string {
  return `${data}\ntextures\n{\nname:"${name}"\ntexture:"${texture.path}"\n}`;
}

function fontsDataSerializer(data: string, [name, fontPath]: [string, string]): string {
  return `${data}\nfonts\n{\nname:"${name}"\nfont:"${fontPath}"\n}`;
}

/**
 * Serializes GUI node data.
 * @param guiData - GUI node data to be serialized.
 * @returns Serialized GUI node data.
 */
export function serializeGUIData(guiData: GUIData): SerializedGUIData {
  const { name } = guiData;
  const gui = Object.entries(guiData.gui).reduce(propertySerializer, "");
  const nodes = guiData.nodes.reduce(guiNodeSerializer, "");
  const textures = Object.entries(guiData.textures).reduce(textureDataSerializer, "")
  const fonts = Object.entries(guiData.fonts).reduce(fontsDataSerializer, "");
  const data = `${gui}${textures}${fonts}${nodes}`;
  return {
    name,
    data
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
