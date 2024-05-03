/**
 * Utility module for handling fonts.
 * @packageDocumentation
 */

import { projectConfig } from "handoff/project";

const fontCache: { [key: string]: string | null } = {};

/**
 * Filters project fonts to find a matching font family.
 * @param projectFont - The font family from the project configuration.
 * @param fontFamily - The font family being searched for.
 * @returns True if the project font matches or includes the font family, otherwise false.
 */
function fontFilter(projectFont: string, fontFamily: string) {
  const normalizedProjectFont = projectFont.toLowerCase();
  const normalizedFontFamily = fontFamily.toLowerCase();
  return (
    normalizedProjectFont === normalizedFontFamily ||
    normalizedProjectFont.includes(normalizedFontFamily) ||
    normalizedFontFamily.includes(normalizedProjectFont)
  );
}

/**
 * Tries to find a font family in the project configuration.
 * @param fontFamily - The font family to search for.
 * @returns The matching font family if found, otherwise null.
 */
export function tryFindFont(fontFamily: string): string | null {
  if (fontCache[fontFamily]) {
    return fontCache[fontFamily];
  }
  const font = projectConfig.fontFamilies.find((projectFont) => fontFilter(projectFont, fontFamily));
  fontCache[fontFamily] = font || null;
  return font || null;
}