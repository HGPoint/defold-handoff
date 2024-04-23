import { propertySerializer } from "utilities/dataSerializers";
import { isTemplateGUINodeType } from "utilities/gui";
import { generateTemplatePath } from "utilities/path";

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

export function serializeGUIDataSet(guiDataSet: GUIData[]): SerializedGUIData[] {
  return guiDataSet.map(serializeGUIData);
}
