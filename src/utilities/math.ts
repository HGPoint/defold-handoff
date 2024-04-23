export function vector4(x: number, y?: number, z?: number, w?: number): Vector4 {
  y = y !== undefined ? y : x;
  z = z !== undefined ? z : x;
  w = w !== undefined ? w : x;
  return { x, y, z, w };
}

export function isVector4(value: unknown): value is Vector4 {
  return (
    !!value &&
    typeof value === "object" &&
    "x" in value && typeof value.x === "number" &&
    "y" in value && typeof value.y === "number" &&
    "z" in value && typeof value.z === "number" &&
    "w" in value && typeof value.w === "number");
}

export function isZeroVector(vector: Vector4) {
  return vector.x === 0 && vector.y === 0 && vector.z === 0 && vector.w === 0;
}

export function isOneScaleVector(vector: Vector4) {
  return vector.x === 1 && vector.y === 1;
}

export function areVectorsEqual(a: Vector4, b: Vector4) {
  return a.x === b.x && a.y === b.y && a.z === b.z && a.w === b.w;
}

export function addVectors(a: Vector4, b: Vector4): Vector4 {
  return vector4(a.x + b.x, a.y + b.y, a.z, a.w);
}

export function subVectors(a: Vector4, b: Vector4): Vector4 {
  return vector4(a.x - b.x, a.y - b.y, a.z, a.w);
}

export function copyVector(vector: Vector4): Vector4 {
  return vector4(vector.x, vector.y, vector.z, vector.w);
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}