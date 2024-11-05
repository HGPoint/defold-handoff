/**
 * Handles operations with text.
 * @packageDocumentation
 */

import { PROJECT_CONFIG } from "handoff/project";
import { vector4 } from "utilities/math";

/**
 * Calculates the text scale based on the font size and the default font size in the project configuration.
 * @param fontSize - The font size of the text layer.
 * @returns The calculated text scale.
 */
export function calculateTextScale(fontSize: number) {
  const scale = fontSize / PROJECT_CONFIG.fontSize;
  return vector4(scale, scale, scale, 1);
}

/**
 * Calculates the text stroke weight based on the font size and the font stroke ratio in the project configuration.
 * @param fontSize - The font size of the text layer.
 * @returns The calculated text stroke weight.
 */
export function calculateTextStrokeWeight(fontSize: number) {
  return fontSize * PROJECT_CONFIG.fontStrokeRatio
}

/**
 * Resolves the final text value based on the content of the text layer.
 * @param text - The content of the text layer.
 * @returns The resolved text value.
 */
export function resolveText(text: string) {
  const lines = splitByLines(text);
  if (isMultilineText(lines)) {
    const combinedLines = joinLines(lines, "\\n\"\n\"");
    return combinedLines;
  }
  return text;
}

/**
 * Checks if the text is multiline.
 * @param lines - An array of text lines.
 * @returns True if the text is multiline, false otherwise.
 */
function isMultilineText(lines: string[]) {
  return lines.length > 1;
}

/**
 * Splits the text into an array of lines.
 * @param data - The text data.
 * @returns The text lines.
 */
export function splitByLines(data: string) {
  const lines = data.trim().split("\n");
  return lines;
}

/**
 * Joins an array of text lines with a divider.
 * @param lines - The array of text lines to join.
 * @param divider - The divider to join the lines.
 * @returns The joined text.
 */
export function joinLines(lines: string[], divider = "\n") {
  const result = lines.join(divider);
  return result;
}
