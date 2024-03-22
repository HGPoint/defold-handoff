import config from "config/config.json";

type PropertyKey = string;
type PropertyValue = string | number | boolean | Vector4;

function isSimpleProperty(value: PropertyValue): value is number | boolean {
  return typeof value === "number" || typeof value === "boolean";
}

function isStringProperty(value: PropertyValue): value is string {
  return typeof value === "string";
}

function isQuotedProperty(key: PropertyKey) {
  return config.constKeys.includes(key);
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
  }
  if (isStringProperty(value)) {
    if (isQuotedProperty(property)) {
      return serializeQuotedProperty(property, value);
    }
    return serializeSimpleProperty(property, value);
  }
  return serializeVector4Property(property, value);
}

export function propertySerializer(serializedProperties: string, [property, value]: [PropertyKey, PropertyValue]): string {
  if (value) {
    return `${serializedProperties}${serializeProperty(property, value)}\n`;
  }
  return serializedProperties;
}
