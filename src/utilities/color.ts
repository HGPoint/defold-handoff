/**
 * Handles color operations.
 * @packageDocumentation
 */

import { vector4 } from "utilities/math";

const TRANSPARENT_WHITE = vector4(1, 1, 1, 0);
const TRANSPARENT_BLACK = vector4(0);
const OPAQUE_WHITE = vector4(1);

/**
 * Determines whether the Figma RGB color is not white.
 * @param rgb - The Figma RGB color to evaluate.
 * @returns True if the color is not white, false otherwise.
 */
export function isNonWhiteRGBColor(rgb: RGB): boolean {
  return rgb.r !== 1 || rgb.g !== 1 || rgb.b !== 1;
}

/**
 * Converts a hexadecimal color string to an RGBA format.
 * @param hex - The hexadecimal color string to convert.
 * @returns The color in RGBA format.
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
 * Converts a color in RGBA format to hexadecimal color string.
 * @param rgba - The RGBA color to convert.
 * @returns The hexadecimal color string.
 */
export function convertRGBAToHex({ x, y, z }: Vector4): string {
  const r = Math.round(x * 255).toString(16).padStart(2, "0");
  const g = Math.round(y * 255).toString(16).padStart(2, "0");
  const b = Math.round(z * 255).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

/**
 * Converts a solid Figma paint to an RGBA format.
 * @param paint - The solid Figma paint to convert.
 * @returns The color in RGBA format.
 */
export function convertPaintToRGBA(paint: SolidPaint) {
  const { color: { r, g, b, }, opacity: a } = paint;
  return vector4(r, g, b, a);
}

/**
 * Resolves the base fill color.
 * @returns The base fill color.
 */
export function resolveBaseFill() {
  return TRANSPARENT_WHITE;
}

/**
 * Resolves the base color.
 * @returns The base color.
 */
export function resolveBaseColor() {
  return OPAQUE_WHITE;
}

/**
 * Resolves the base outline color.
 * @returns The base outline color.
 */
export function resolveBaseTextOutline() {
  return TRANSPARENT_WHITE;
}

/**
 * Resolves the base shadow color.
 * @returns The base shadow color.
 */
export function resolveBaseTextShadowColor() {
  return TRANSPARENT_WHITE;
}

/**
 * Resolves the base background color.
 * @returns The base background color.
 */
export function resolveBaseBackgroundColor() {
  return TRANSPARENT_BLACK;
}