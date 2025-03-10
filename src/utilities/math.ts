/**
 * Handles math.
 * @packageDocumentation
 */

/**
 * Constructs a Vector4. If some components are omitted, they default to the value of the x component.
 * @param x - The x component of the vector.
 * @param y - The y component of the vector.
 * @param z - The z component of the vector.
 * @param w - The w component of the vector.
 * @returns A Vector4 with the specified components.
 */
export function vector4(x: number, y?: number, z?: number, w?: number): Vector4 {
  if (y == undefined && z == undefined && w == undefined) {
    return { x, y: x, z: x, w: x };
  }
  y = y !== undefined ? y : 0;
  z = z !== undefined ? z : 0;
  w = w !== undefined ? w : 0;
  return { x, y, z, w };
}

/**
 * Determines whether a value is a Vector4.
 * @param value - The value to check.
 * @returns True if the value is a Vector4, otherwise false.
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
 * Determines whether a vector is a zero vector.
 * @param vector - The vector to check.
 * @returns True if the vector is a zero vector, otherwise false.
 */
export function isZeroVector(vector?: Vector4): boolean {
  if (!vector) {
    return false;
  }
  return vector.x === 0 && vector.y === 0 && vector.z === 0 && vector.w === 0;
}

/**
 * Determines whether a vector is a one-scale vector.
 * @param vector - The vector to check.
 * @returns True if the vector is a one-scale vector, otherwise false.
 */
export function isOneScaleVector(vector?: Vector4): boolean {
  if (!vector) {
    return false;
  }
  return vector.x === 1 && vector.y === 1;
}

/**
 * Determines whether two vectors are equal.
 * @param a - The first vector.
 * @param b - The second vector.
 * @returns True if the vectors are equal, otherwise false.
 */
export function areVectorsEqual(a: Vector4, b: Vector4): boolean {
  return a.x === b.x && a.y === b.y && a.z === b.z && a.w === b.w;
}

/**
 * Adds multiple vectors component-wise.
 * @param vector - The first vector.
 * @param vectors - Vectors to add.
 * @returns A vector representing the component-wise sum of the two input vectors.
 */
export function addVectors(vector: Vector4, ...vectors: Vector4[]): Vector4 {
  return vectors.reduce(vectorSumReducer, vector);
}

function vectorSumReducer(vectorSum: Vector4, vector: Vector4) {
  const x = vectorSum.x + vector.x;
  const y = vectorSum.y + vector.y
  const z = vectorSum.z + vector.z
  const w = vectorSum.w + vector.w
  return vector4(x, y, z, w);
}

export function addValueToVector(vector: Vector4, value: number): Vector4 {
  const x = vector.x + value;
  const y = vector.y + value;
  const z = vector.z + value;
  const w = vector.w + value;
  return vector4(x, y, z, w);
} 

/**
 * Subtracts two vectors component-wise.
 * @param a - The first vector.
 * @param b - The second vector.
 * @returns A vector representing the component-wise difference of the two input vectors.
 */
export function subVectors(a: Vector4, b: Vector4): Vector4 {
  return vector4(a.x - b.x, a.y - b.y, a.z, a.w);
}

export function multiplyVectorByValue(vector: Vector4, value: number): Vector4 {
  const x = vector.x * value;
  const y = vector.y * value;
  const z = vector.z * value;
  const w = vector.w * value;
  return vector4(x, y, z, w);
}

/**
 * Creates a copy of the vector.
 * @param vector - The vector to copy.
 * @returns A copy of the vector.
 */
export function copyVector(vector: Vector4): Vector4 {
  return vector4(vector.x, vector.y, vector.z, vector.w);
}

export function flipVector(vector: Vector4): Vector4 {
  return multiplyVectorByValue(vector, -1);
}

export function flipVectorX(vector: Vector4): Vector4 {
  const { x, y, z, w } = vector;
  return vector4(-x, y, z, w)
}

export function flipVectorY(vector: Vector4): Vector4 {
  const { x, y, z, w } = vector;
  return vector4(x, -y, z, w)
}

export function flipVectorZ(vector: Vector4): Vector4 {
  const { x, y, z, w } = vector;
  return vector4(x, y, -z, w)
}

export function flipVectorW(vector: Vector4): Vector4 {
  const { x, y, z, w } = vector;
  return vector4(x, y, z, -w)
}

/**
 * Clamps a value between a minimum and maximum value.
 * @param value - The value to clamp.
 * @param min - The minimum allowable value.
 * @param max - The maximum allowable value.
 * @returns The clamped value.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function detectSign(value: number): 1 | -1 {
  if (value >= 0) {
    return 1
  }
  return -1;
}

export function absFloor(value: number): number {
  const sign = detectSign(value);
  const flooredValue = Math.floor(Math.abs(value));
  return flooredValue * sign;
}

/**
 * Formats a number to three decimal places.
 * @param value - The number to format.
 * @returns The number rounded to three decimal places.
 */
export function readableNumber(number: number): number {
  return Math.round(number * 1000) / 1000;
}

export function readableVector(vector: Vector4): Vector4 {
  const x = readableNumber(vector.x);
  const y = readableNumber(vector.y);
  const z = readableNumber(vector.z);
  const w = readableNumber(vector.w);
  return vector4(x, y, z, w);
}

/**
 * Calculates the coordinates of the center of a rectangle rotated around its top-left corner.
 * @param x - The x-coordinate of the top-left corner.
 * @param y - The y-coordinate of the top-left corner.
 * @param width - The width of the rectangle.
 * @param height - The height of the rectangle.
 * @param rotation - The rotation angle in degrees.
 * @returns The center coordinates of the rotated  rectangle.
 */
export function calculateCenter(x: number, y: number, width: number, height: number, rotation: number): Vector4 {
  const radians = rotation * Math.PI / 180;
  const upperRightX = x + width * Math.cos(radians);
  const upperRightY = y - width * Math.sin(radians);
  const lowerLeftX = x + height * Math.sin(radians);
  const lowerLeftY = y + height * Math.cos(radians);
  const lowerRightX = upperRightX + height * Math.sin(radians);
  const lowerRightY = upperRightY + height * Math.cos(radians);
  const centerX = (x + lowerRightX + upperRightX + lowerLeftX) / 4;
  const centerY = (y + lowerRightY + upperRightY + lowerLeftY) / 4;
  return vector4(centerX, centerY, 0, 0);
}

/**
 * Calculates the hypotenuse of a right triangle.
 * @param a - The length of the first leg.
 * @param b - The length of the second leg.
 * @returns The length of the hypotenuse.
 */
export function calculateHypotenuse(a: number, b: number): number {
  return Math.sqrt(a * a + b * b);
}

export function shiftAlongAxis(shift: Vector4, rotation: number): Vector4 {
  const rotationRadians = rotation * Math.PI / 180;
  const x = shift.x * Math.cos(rotationRadians) - shift.y * Math.sin(rotationRadians);
  const y = shift.x * Math.sin(rotationRadians) + shift.y * Math.cos(rotationRadians);
  return vector4(x, y, 0, 0);
}