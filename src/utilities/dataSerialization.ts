/**
 * Handles Defold property serialization.
 * @packageDocumentation
 */

import config from "config/config.json";
import { PROJECT_CONFIG } from "handoff/project";
import { areVectorsEqual, isVector4, readableNumber, readableQuaternion, readableVector, vector4 } from "utilities/math";
import { formattedNumber } from "utilities/text";

/**
 * Reducer function to serialize properties into a Defold's component text structure.
 * @param serializedProperties - The cumulative serialized properties.
 * @param property - The property and its value pair to serialize.
 * @returns The updated serialized properties.
 */
export function propertySerializer<T>(serializedProperties: string, [property, value]: [keyof T, T[keyof T]], format: boolean = true): string {
  if (hasPropertyValue(value)) {
    const serializedProperty = serializeProperty(property, value, format);
    if (!serializedProperty) {
      return serializedProperties;
    }
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
export function serializeProperty<T>(property: keyof T, value: T[keyof T], format: boolean = true): string {
  if (isSimpleProperty(value)) {
    return serializeSimpleProperty(property, value, format);
  } else if (isStringProperty(value)) {
    if (isQuotedProperty(property)) {
      return serializeQuotedProperty(property, value);
    }
    return serializeSimpleProperty(property, value, format);
  }
  else if (isVector4Property(value)) {
    return serializeVector4Property(property, value, format);
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
function serializeSimpleProperty<T>(property: keyof T, value: number | boolean | string, format: boolean = true): string {
  if (typeof value === "number") {
    const readableValue = readableNumber(value);
    const resolvedValue = format ? formattedNumber(readableValue) : readableValue;
    return `${property.toString()}: ${resolvedValue}`;
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
export function serializeVector4Property<T>(property: keyof T, value: Vector4, format: boolean = true, defaultValue: Vector4 = vector4(0)): string {
  const serializedValue = PROJECT_CONFIG.omitDefaultValues ? serializeOmittedVector4Value(value, defaultValue, format) : serializeVector4Value(value, format); 
  if (!serializedValue) {
    return "";
  }
  return `${property.toString()} ${serializedValue}`;
}

function serializeVector4Value(value: Vector4, format: boolean = true): string {
  const { x, y, z, w } = readableVector(value);
  const resolvedX = format ? formattedNumber(x) : x;
  const resolvedY = format ? formattedNumber(y) : y;
  const resolvedZ = format ? formattedNumber(z) : z;
  const resolvedW = format ? formattedNumber(w) : w;
  return `{\n  x: ${resolvedX}\n  y: ${resolvedY}\n  z: ${resolvedZ}\n  w: ${resolvedW}\n}`;
}

function serializeOmittedVector4Value(value: Vector4, defaultValue: Vector4 = vector4(0), format: boolean = true): string {
  const vector = readableVector(value);
  if (areVectorsEqual(vector, defaultValue)) {
    return "";
  }
  const { x, y, z, w } = vector;
  let serializedValue = "{\n";
  if (x !== defaultValue.x) {
    const formattedX = format ? formattedNumber(x) : x;
    serializedValue += `  x: ${formattedX}\n`;
  }
  if (y !== defaultValue.y) {
    const formattedY = format ? formattedNumber(y) : y;
    serializedValue += `  y: ${formattedY}\n`;
  }
  if (z !== defaultValue.z) {
    const formattedZ = format ? formattedNumber(z) : z;
    serializedValue += `  z: ${formattedZ}\n`;
  }
  if (w !== defaultValue.w) {
    const formattedW = format ? formattedNumber(w) : w;
    serializedValue += `  w: ${formattedW}\n`;
  }
  serializedValue += "}";
  return serializedValue;
}

export function serializeQuaternionProperty<T>(property: keyof T, value: Vector4, format: boolean = true, defaultValue: Vector4 = vector4(0)): string {
  const serializedValue = PROJECT_CONFIG.omitDefaultValues ? serializeOmittedQuaternionValue(value, defaultValue, format) : serializeQuaternionValue(value, format);
  if (!serializedValue) {
    return "";
  }
  return `${property.toString()} ${serializedValue}`;
}

function serializeQuaternionValue(value: Vector4, format: boolean = true): string {
  const { x, y, z, w } = readableQuaternion(value);
  const resolvedX = format ? formattedNumber(x) : x;
  const resolvedY = format ? formattedNumber(y) : y;
  const resolvedZ = format ? formattedNumber(z) : z;
  const resolvedW = format ? formattedNumber(w) : w;
  return `{\n  x: ${resolvedX}\n  y: ${resolvedY}\n  z: ${resolvedZ}\n  w: ${resolvedW}\n}`;
}

function serializeOmittedQuaternionValue(value: Vector4, defaultValue: Vector4 = vector4(0), format: boolean = true): string {
  const quaternion = readableVector(value);
  if (areVectorsEqual(quaternion, defaultValue)) {
    return "";
  }
  const { x, y, z, w } = quaternion;
  let serializedValue = "{\n";
  if (x !== defaultValue.x) {
    const formattedX = format ? formattedNumber(x) : x;
    serializedValue += `  x: ${formattedX}\n`;
  }
  if (y !== defaultValue.y) {
    const formattedY = format ? formattedNumber(y) : y;
    serializedValue += `  y: ${formattedY}\n`;
  }
  if (z !== defaultValue.z) {
    const formattedZ = format ? formattedNumber(z) : z;
    serializedValue += `  z: ${formattedZ}\n`;
  }
  if (w !== defaultValue.w) {
    const formattedW = format ? formattedNumber(w) : w;
    serializedValue += `  w: ${formattedW}\n`;
  }
  serializedValue += "}";
  return serializedValue;
}