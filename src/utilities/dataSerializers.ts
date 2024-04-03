import config from "config/config.json";

function hasValue(value: SerializableGUINodeDataValue) {
  return value !== null && value !== undefined;
}

function isSimpleProperty(value: SerializableGUINodeDataValue): value is number | boolean {
  return typeof value === "number" || typeof value === "boolean";
}

function isStringProperty(value: SerializableGUINodeDataValue): value is string {
  return typeof value === "string";
}

function isQuotedProperty(key: SerializableGUINodeDataKey) {
  return !config.constKeys.includes(key);
}

function isVector4Property(value: SerializableGUINodeDataValue): value is Vector4 {
  return typeof value == "object" &&  "x" in value && "y" in value && "z" in value && "w" in value;
}

function serializeSimpleProperty(property: SerializableGUINodeDataKey, value: SerializableGUINodeDataValue): string {
  return `${property}: ${value}`;
}

function serializeQuotedProperty(property: SerializableGUINodeDataKey, value: SerializableGUINodeDataValue): string {
  return `${property}: "${value}"`;
}

function serializeVector4Property(property: SerializableGUINodeDataKey, value: Vector4): string {
  return `${property} {\nx: ${value.x}\ny: ${value.y}\nz: ${value.z}\nw: ${value.w}\n}`;
}

export function serializeProperty(property: SerializableGUINodeDataKey, value: SerializableGUINodeDataValue): string {
  if (isSimpleProperty(value)) {
    return serializeSimpleProperty(property, value);
  } else if (isStringProperty(value)) {
    if (isQuotedProperty(property)) {
      return serializeQuotedProperty(property, value);
    }
    return serializeSimpleProperty(property, value);
  }
  else if (isVector4Property(value)) {
    return serializeVector4Property(property, value);
  }
  return "";
}

export function propertySerializer(serializedProperties: string, [property, value]: [SerializableGUINodeDataKey, SerializableGUINodeDataValue]): string {
  if (hasValue(value)) {
    return `${serializedProperties}${serializeProperty(property, value)}\n`;
  }
  return serializedProperties;
}
