export function vector4(x: number, y?: number, z?: number, w?: number): Vector4 {
  y = y !== undefined ? y : x;
  z = z !== undefined ? z : x;
  w = w !== undefined ? w : x;
  return { x, y, z, w };
}

export function isZeroVector4(vector: Vector4) {
  return vector.x === 0 && vector.y === 0 && vector.z === 0 && vector.w === 0;
}