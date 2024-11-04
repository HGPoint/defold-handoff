/**
 * Utility module for handling Defold property serialization.
 * @packageDocumentation
 */

import config from "config/config.json";
import { readableNumber, isVector4 } from "utilities/math";

/**
 * Checks if a value has a valid non-null and non-undefined value.
 * @param value - The value to check.
 * @returns True if the value is not null and not undefined, otherwise false.
 */
function hasValue<T>(value: T[keyof T]) {
  return value !== null && value !== undefined;
}

/**
 * Checks if a value is a simple property (number or boolean). Value that should not be quoted.
 * @param value - The value to check.
 * @returns True if the value is a number or boolean, otherwise false.
 */
function isSimpleProperty<T>(value: T[keyof T]): value is T[keyof T] & (number | boolean) {
  return typeof value === "number" || typeof value === "boolean";
}

/**
 * Checks if a value is a string property. Value that should be quoted.
 * @param value - The value to check.
 * @returns True if the value is a string, otherwise false.
 */
function isStringProperty<T>(value: T[keyof T]): value is T[keyof T] & string {
  return typeof value === "string";
}

/**
 * Checks if values is a special string property that should be quoted.
 * @param key - The property key.
 * @returns True if the property should be quoted, otherwise false.
 */
function isQuotedProperty<T>(key: (keyof T)) {
  return typeof key === "string" && !config.constKeys.includes(key);
}

/**
 * Checks if a value is a Vector4 property. Value that should be serialized as a Vector4.
 * @param value - The value to check.
 * @returns True if the value is a Vector4, otherwise false.
 */
function isVector4Property<T>(value: T[keyof T]): value is T[keyof T] & Vector4 {
  return !!value && isVector4(value);
}

/**
 * Serializes a simple property (number or boolean).
 * @param property - The property key.
 * @param value - The property value.
 * @returns The serialized property string.
 */
function serializeSimpleProperty<T>(property: keyof T, value: number | boolean | string): string {
  if (typeof value === "number") {
    return `${property.toString()}: ${readableNumber(value)}`;
  }
  return `${property.toString()}: ${value}`;
}

/**
 * Serializes a quoted property (string).
 * @param property - The property key.
 * @param value - The property value.
 * @returns The serialized property string.
 */
function serializeQuotedProperty<T>(property: keyof T, value: string): string {
  return `${property.toString()}: "${value}"`;
}

/**
 * Serializes a Vector4 property.
 * @param property - The property key.
 * @param value - The property value.
 * @returns The serialized property string.
 */
function serializeVector4Property<T>(property: keyof T, value: Vector4): string {
  return `${property.toString()} {\n  x: ${readableNumber(value.x)}\n  y: ${readableNumber(value.y)}\n  z: ${readableNumber(value.z)}\n  w: ${readableNumber(value.w)}\n}`;
}

/**
 * Serializes a property based on its type.
 * @param property - The property key.
 * @param value - The property value.
 * @returns The serialized property string.
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
 * Serializes properties of an object into a string based on their type.
 * @param serializedProperties - The string containing already serialized properties.
 * @param property - The property key-value pair to serialize.
 * @returns The updated string with serialized properties.
 */
export function propertySerializer<T>(serializedProperties: string, [property, value]: [keyof T, T[keyof T]]): string {
  if (hasValue(value)) {
    const serializedProperty = serializeProperty(property, value);
    return `${serializedProperties}${serializedProperty}\n`;
  }
  return serializedProperties;
}
