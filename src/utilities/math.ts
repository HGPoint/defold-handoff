/**
 * Utility module for handling math.
 * @packageDocumentation
 */

/**
 * Constructs a Vector4 object with the given components. If some components are omitted, they default to the same value as the x component.
 * @param x - The x component of the vector.
 * @param y - The y component of the vector.
 * @param z - The z component of the vector.
 * @param w - The w component of the vector.
 * @returns A Vector4 object with the specified components.
 */
export function vector4(x: number, y?: number, z?: number, w?: number): Vector4 {
  y = y !== undefined ? y : x;
  z = z !== undefined ? z : x;
  w = w !== undefined ? w : x;
  return { x, y, z, w };
}

/**
 * Checks if the given value is a Vector4 object.
 * @param value - The value to check.
 * @returns True if the value is a Vector4 object, otherwise false.
 */
export function isVector4(value: unknown): value is Vector4 {
  return (
    !!value &&
    typeof value === "object" &&
    "x" in value && typeof value.x === "number" &&
    "y" in value && typeof value.y === "number" &&
    "z" in value && typeof value.z === "number" &&
    "w" in value && typeof value.w === "number");
}

/**
 * Checks if the given vector is a zero vector (all components are zero).
 * @param vector - The vector to check.
 * @returns True if the vector is a zero vector, otherwise false.
 */
export function isZeroVector(vector?: Vector4) {
  if (!vector) {
    return true;
  }
  return vector.x === 0 && vector.y === 0 && vector.z === 0 && vector.w === 0;
}

/**
 * Checks if the given vector is a one-scale vector (x and y components are both 1).
 * @param vector - The vector to check.
 * @returns True if the vector is a one-scale vector, otherwise false.
 */
export function isOneScaleVector(vector?: Vector4) {
  if (!vector) {
    return false;
  }
  return vector.x === 1 && vector.y === 1;
}

/**
 * Checks if two vectors are equal (all components are equal).
 * @param a - The first vector.
 * @param b - The second vector.
 * @returns True if the vectors are equal, otherwise false.
 */
export function areVectorsEqual(a: Vector4, b: Vector4) {
  return a.x === b.x && a.y === b.y && a.z === b.z && a.w === b.w;
}

/**
 * Adds two vectors component-wise.
 * @param a - The first vector.
 * @param b - The second vector.
 * @returns The sum of the two vectors.
 */
export function addVectors(a: Vector4, b: Vector4): Vector4 {
  return vector4(a.x + b.x, a.y + b.y, a.z, a.w);
}

/**
 * Subtracts two vectors component-wise.
 * @param a - The first vector.
 * @param b - The second vector.
 * @returns The difference of the two vectors.
 */
export function subVectors(a: Vector4, b: Vector4): Vector4 {
  return vector4(a.x - b.x, a.y - b.y, a.z, a.w);
}

/**
 * Creates a copy of the given vector.
 * @param vector - The vector to copy.
 * @returns A copy of the vector.
 */
export function copyVector(vector: Vector4): Vector4 {
  return vector4(vector.x, vector.y, vector.z, vector.w);
}

/**
 * Clamps a value between a minimum and maximum value.
 * @param value - The value to clamp.
 * @param min - The minimum value.
 * @param max - The maximum value.
 * @returns The clamped value.
 */
export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Formats a number to a readable format (rounds to 3 decimal places).
 * @param value - The number to format.
 * @returns The formatted number.
 */
export function readableNumber(number: number): number {
  return Math.round(number * 1000) / 1000;
}

/**
 * Calculates the center of a rectangle rotated around a point.
 * @param x - The x coordinate of top-left corner.
 * @param y - The y coordinate of top-left corner.
 * @param width - The width of the rectangle.
 * @param height - The height of the rectangle.
 * @param degrees - The rotation in degrees.
 * @returns The center of the rectangle.
 */
export function calculateCenter(x: number, y: number, width: number, height: number, degrees: number) {
  const radians = degrees * Math.PI / 180;
  const upperRightX = x + width * Math.cos(radians);
  const upperRightY = y - width * Math.sin(radians);
  const lowerLeftX = x + height * Math.sin(radians);
  const lowerLeftY = y + height * Math.cos(radians);
  const lowerRightX = upperRightX + height * Math.sin(radians);
  const lowerRightY = upperRightY + height * Math.cos(radians);
  const centerX = (x + lowerRightX + upperRightX + lowerLeftX) / 4;
  const centerY = (y + lowerRightY + upperRightY + lowerLeftY) / 4;
  return vector4(centerX, centerY, 0, 1);
}