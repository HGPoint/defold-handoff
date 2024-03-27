import config from "config/config.json";

type PropertyKey = string;
type PropertyValue = string | number | boolean | Vector4;

function hasValue(value: PropertyValue) {
  return value !== null && value !== undefined;
}

function isSimpleProperty(value: PropertyValue): value is number | boolean {
  return typeof value === "number" || typeof value === "boolean";
}

function isStringProperty(value: PropertyValue): value is string {
  return typeof value === "string";
}

function isQuotedProperty(key: PropertyKey) {
  return !config.constKeys.includes(key);
}

function isVector4Property(value: PropertyValue): value is Vector4 {
  return typeof value == "object" &&  "x" in value && "y" in value && "z" in value && "w" in value;
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

export function serializeProperty(property: PropertyKey, value: PropertyValue): string {
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

export function propertySerializer(serializedProperties: string, [property, value]: [PropertyKey, PropertyValue]): string {
  if (hasValue(value)) {
    return `${serializedProperties}${serializeProperty(property, value)}\n`;
  }
  return serializedProperties;
}
