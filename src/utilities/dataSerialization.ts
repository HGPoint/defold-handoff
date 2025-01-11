/**
 * Handles Defold property serialization.
 * @packageDocumentation
 */

import { PROJECT_CONFIG } from "handoff/project";
import config from "config/config.json";
import { isVector4, readableNumber } from "utilities/math";

/**
 * Serializes data into a Defold's component text structure.
 * @param data - The data to serialize.
 * @returns The serialized properties.
 */
export function serializeProperties<T extends object>(data: T): string {
  const serializedProperties = Object.entries(data).reduce(propertySerializer, "");
  const trimmedProperties = serializedProperties.trim();
  return trimmedProperties;
}

/**
 * Reducer function to serialize properties into a Defold's component text structure.
 * @param serializedProperties - The cumulative serialized properties.
 * @param property - The property and its value pair to serialize.
 * @returns The updated serialized properties.
 */
export function propertySerializer<T>(serializedProperties: string, [property, value]: [keyof T, T[keyof T]]): string {
  if (hasPropertyValue(value)) {
    const serializedProperty = serializeProperty(property, value);
    return `${serializedProperties}${serializedProperty}\n`;
  }
  return serializedProperties;
}

/**
 * Determines whether a value is meaningful.
 * @param value - The value to check.
 * @returns True if the value is not null and not undefined, otherwise false.
 */
function hasPropertyValue<T>(value: T[keyof T]) {
  return value !== null && value !== undefined;
}

/**
 * Serializes a property based on its type.
 * @param property - The property.
 * @param value - The property value.
 * @returns The serialized property.
 */
export function serializeProperty<T>(property: keyof T, value: T[keyof T]): string {
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

/**
 * Determines whether a value is a number or a boolean. Such values should not be in quotes when serialized.
 * @param value - The value to check.
 * @returns True if the value is a number or boolean, otherwise false.
 */
function isSimpleProperty<T>(value: T[keyof T]): value is T[keyof T] & (number | boolean) {
  return typeof value === "number" || typeof value === "boolean";
}

/**
 * Determines whether a value is a string. Such values should be in quotes when serialized.
 * @param value - The value to check.
 * @returns True if the value is a string, otherwise false.
 */
function isStringProperty<T>(value: T[keyof T]): value is T[keyof T] & string {
  return typeof value === "string";
}

/**
 * Determines whether property is a special string property. Such values should be in quotes when serialized.
 * @param key - The property.
 * @returns True if the property should be quoted, otherwise false.
 */
function isQuotedProperty<T>(key: (keyof T)) {
  return typeof key === "string" && !config.constKeys.includes(key);
}

/**
 * Determines whether a value is a Vector4. Such values should be serialized as a block.
 * @param value - The value to check.
 * @returns True if the value is a Vector4, otherwise false.
 */
function isVector4Property<T>(value: T[keyof T]): value is T[keyof T] & Vector4 {
  return !!value && isVector4(value);
}

/**
 * Serializes a number or a boolean property.
 * @param property - The property.
 * @param value - The property value.
 * @returns The serialized Defold's component property string.
 */
function serializeSimpleProperty<T>(property: keyof T, value: number | boolean | string): string {
  if (typeof value === "number") {
    return `${property.toString()}: ${readableNumber(value)}`;
  }
  return `${property.toString()}: ${value}`;
}

/**
 * Serializes a string property.
 * @param property - The property.
 * @param value - The property value.
 * @returns The serialized Defold's component property string.
 */
function serializeQuotedProperty<T>(property: keyof T, value: string): string {
  return `${property.toString()}: "${value}"`;
}

/**
 * Serializes a Vector4 property.
 * @param property - The property.
 * @param value - The property value.
 * @returns The serialized Defold's component property string.
 */
function serializeVector4Property<T>(property: keyof T, value: Vector4): string {
  const serializedValue = PROJECT_CONFIG.omitDefaultValues ? serializeOmittedVector4Value(value) : serializeVector4Value(value); 
  return `${property.toString()} ${serializedValue}`;
}

function serializeVector4Value(value: Vector4): string {
  return `{\n  x: ${readableNumber(value.x)}\n  y: ${readableNumber(value.y)}\n  z: ${readableNumber(value.z)}\n  w: ${readableNumber(value.w)}\n}`;
}

function serializeOmittedVector4Value(value: Vector4): string {
  let serializedValue = "{\n";
  if (value.x !== 0) {
    serializedValue += `  x: ${readableNumber(value.x)}\n`;
  }
  if (value.y !== 0) {
    serializedValue += `  y: ${readableNumber(value.y)}\n`;
  }
  if (value.z !== 0) {
    serializedValue += `  z: ${readableNumber(value.z)}\n`;
  }
  if (value.w !== 0) {
    serializedValue += `  w: ${readableNumber(value.w)}\n`;
  }
  serializedValue += "}";
  return serializedValue;
}