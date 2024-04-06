import { projectConfig } from "handoff/project";

const fontCache: { [key: string]: string | null } = {};

function fontFilter(projectFont: string, fontFamily: string) {
  const normalizedProjectFont = projectFont.toLowerCase();
  const normalizedFontFamily = fontFamily.toLowerCase();
  return (
    normalizedProjectFont === normalizedFontFamily ||
    normalizedProjectFont.includes(normalizedFontFamily) ||
    normalizedFontFamily.includes(normalizedProjectFont)
  );
}

export function tryFindFont(fontFamily: string): string | null {
  if (fontCache[fontFamily]) {
    return fontCache[fontFamily];
  }
  const font = projectConfig.fontFamilies.find((projectFont) => fontFilter(projectFont, fontFamily));
  fontCache[fontFamily] = font || null;
  return font || null;
}