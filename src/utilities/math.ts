export function vector4(x: number, y?: number, z?: number, w?: number) {
  y = y !== undefined ? y : x;
  z = z !== undefined ? z : x;
  w = w !== undefined ? w : x;
  return { x, y, z, w };
}
