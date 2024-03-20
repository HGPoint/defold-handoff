import config from "../config/config.json";

type PropertyKey = string;
type PropertyValue = string | number | boolean | Vector4;

function isSimpleProperty(value: PropertyValue): value is number | boolean {
  return typeof value === "number" || typeof value === "boolean";
}

function isStringProperty(value: PropertyValue): value is string {
  return typeof value === "string";
}

function isQuotedProperty(key: PropertyKey) {
  return config.defoldConstKeys.includes(key);
}

function serializeSimpleProperty(property: PropertyKey, value: PropertyValue): string {
  return `${property}: ${value}`;
}

function serializeQuotedProperty(property: PropertyKey, value: PropertyValue): string {
  return `${property}: "${value}"`;
}

function serializeVector4Property(property: PropertyKey, value: Vector4): string {
  return `${property} {\nx:  ${value.x}\n  y: ${value.y}\n  z: ${value.z}\n  w: ${value.w}\n}`;
}

function serializeProperty(property: PropertyKey, value: PropertyValue): string {
  if (isSimpleProperty(value)) {
    return serializeSimpleProperty(property, value);
  }
  if (isStringProperty(value)) {
    if (isQuotedProperty(property)) {
      return serializeQuotedProperty(property, value);
    }
    return serializeSimpleProperty(property, value);
  }
  return serializeVector4Property(property, value);
}

function propertySerializer(serializedProperties: string, [property, value]: [PropertyKey, PropertyValue]): string {
  if (value) {
    return `${serializedProperties}${serializeProperty(property, value)}\n`;
  }
  return serializedProperties;
}

function guiNodeDataSerializer(acc: string, guiNode: GUINodeData): string {
  const component = Object.entries(guiNode).reduce(propertySerializer, "");
  return `${acc}\nnodes\n{\n${component}}`;
}

function textureDataSerializer(acc: string, [name, texture]: [string, TextureAtlasData]): string {
  return `${acc}\ntextures\n{\n  name: "${name}"\n  texture: "${texture.path}"\n}`;
}

function fontsDataSerializer(acc: string, [name, fontPath]: [string, string]): string {
  return `${acc}\nfonts\n{\n  name: "${name}"\n  font: "${fontPath}"\n}`;
}

export function serializeDefoldData(defoldObject: DefoldData): SerializedDefoldData {
  const gui = Object.entries(defoldObject.gui).reduce(propertySerializer, "");
  const nodes = defoldObject.nodes.reduce(guiNodeDataSerializer, "");
  const textures = Object.entries(defoldObject.textures).reduce(textureDataSerializer, "")
  const fonts = Object.entries(defoldObject.fonts).reduce(fontsDataSerializer, "");
  return {
    name: defoldObject.name,
    data: `${gui}${textures}${fonts}${nodes}`
  };
}

export function serializeDefoldDataSet(defoldObjectsSet: DefoldData[]): SerializedDefoldData[] {
  return defoldObjectsSet.map(serializeDefoldData);
}