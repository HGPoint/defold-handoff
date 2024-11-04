/**
 * Utility module for handling color operations.
 * @packageDocumentation
 */

import { vector4 } from "utilities/math";

/**
 * Converts a hexadecimal color representation to RGBA format.
 * @param hex - The hexadecimal color string.
 * @returns The RGBA color vector.
 */
export function convertHexToRGBA(hex: string): Vector4 {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const a = 1;
  return vector4(r, g, b, a);
}

/**
 * Converts an RGBA color representation to hexadecimal format.
 * @param rgba - The RGBA color vector.
 * @returns The hexadecimal color string.
 */
export function convertRGBAToHex(rgba: Vector4): string {
  const r = Math.round(rgba.x * 255).toString(16).padStart(2, "0");
  const g = Math.round(rgba.y * 255).toString(16).padStart(2, "0");
  const b = Math.round(rgba.z * 255).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

/**
 * Checks if the RGB color vector is not white.
 * @param rgb - The RGB color vector.
 * @returns A boolean indicating if the color is not white.
 */
export function nonWhiteRGB(rgb: RGB): boolean {
  return rgb.r !== 1 || rgb.g !== 1 || rgb.b !== 1;
}

/**
 * Calculates the RGBA color value for a given solid paint.
 * @param paint - The solid paint to calculate the color value for.
 * @returns The RGBA color value.
 */
export function calculateColorValue(paint: SolidPaint) {
  const { color: { r, g, b, }, opacity: a } = paint;
  return vector4(r, g, b, a);
}
