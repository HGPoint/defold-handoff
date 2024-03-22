import { vector4 } from "utilities/math";

export function convertHexToRGBA(hex: string): Vector4 {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const a = 1;
  return vector4(r, g, b, a);
}