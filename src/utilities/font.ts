/**
 * Handles fonts, including extraction and processing of font data.
 * @packageDocumentation
 */

import { PROJECT_CONFIG } from "handoff/project";
import { hasChildren, isFigmaBox, isFigmaComponentInstance, isFigmaText, isLayerExportable } from "utilities/figma";
import { generateFontPath } from "utilities/path";
import { runVariantPipeline } from "utilities/variantPipeline";

const FONT_CACHE: { [key: string]: WithNull<string> } = {};

const FONT_VARIANT_PIPELINE: VariantPipeline<FontVariantPipelineData, FontData> = {
  process: extractFontData,
}

/**
 * Attempts to find a matching font family in the project configuration.
 * @param fontFamily - The font family to look for.
 * @returns The matching font family if found, otherwise null.
 */
export function tryFindFont(fontFamily: string): WithNull<string> {
  if (FONT_CACHE[fontFamily]) {
    return FONT_CACHE[fontFamily];
  }
  const fontData = PROJECT_CONFIG.fontFamilies.find((projectFont) => fontFilter(projectFont, fontFamily));
  const font = fontData ? fontData.id : null;
  FONT_CACHE[fontFamily] = font;
  return font;
}

/**
 * Filter function to check if the font family matches or is included in one of the project font families.
 * @param projectFont - The font family from the project configuration to check against.
 * @param fontFamily - The font family to look for.
 * @returns True if the font family matches or is included in one of the project font families, otherwise false.
 */
function fontFilter(projectFont: ProjectFontData, fontFamily: string) {
  const normalizedProjectFont = projectFont.name.toLowerCase();
  const normalizedFontFamily = fontFamily.toLowerCase();
  return (
    normalizedProjectFont === normalizedFontFamily ||
    normalizedProjectFont.includes(normalizedFontFamily) ||
    normalizedFontFamily.includes(normalizedProjectFont)
  );
}

/**
 * Recursively extracts font data from a tree of Figma layers.
 * @async
 * @param layer - The Figma layer to extract font data from.
 * @param variantExtractor - Optional function to extract font data for variants.
 * @param skipVariants - Indicates if variants should be skipped.
 * @returns The extracted font data.
 */
export async function extractFontData(data: FontVariantPipelineData, fontData: FontData = {}) {
  const { layer, skipVariants } = data;
  if (isLayerExportable(layer)) {
    if (isFigmaText(layer)) {
      for (const font of PROJECT_CONFIG.fontFamilies) {
        if (!fontData[font.name]) {
          const path = generateFontPath(font);
          fontData[font.name] = path;
        }
      }
    }
    if (isFigmaBox(layer)) {
      if (hasChildren(layer)) {
        const childrenData = await processChildrenFontData(layer, skipVariants);
        fontData = { ...fontData, ...childrenData };
      }
      if (!skipVariants && isFigmaComponentInstance(layer)) {
        const variantData = await runVariantPipeline(FONT_VARIANT_PIPELINE, { layer, skipVariants: true }, fontData);
        fontData = { ...fontData, ...variantData };
      }
    }
  }
  return fontData;
}

/**
 * Processes font data for the children of a Figma layer.
 * @param layer - The Figma layer to process children font data for.
 * @returns The generated font data.
 */
async function processChildrenFontData(layer: BoxLayer, skipVariants: boolean) {
  let fontData: FontData = {};
  for (const child of layer.children) {
    const data = { layer: child, skipVariants };
    const childData = await extractFontData(data);
    fontData = { ...fontData, ...childData };
  }
  return fontData;
}
