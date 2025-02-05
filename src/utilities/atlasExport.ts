/**
 * Handles atlas data export.
 * @packageDocumentation
 */

import { isAtlasStatic, resolveAtlasName } from "utilities/atlas";
import { convertAtlasData, convertSpriteData, convertSpriteName } from "utilities/atlasConversion";
import { isFigmaText } from "utilities/figma";

/**
 * Exports atlas data.
 * @param layer - The layer to export atlas data from.
 * @param scale - The scale to export images at.
 * @returns The atlas data.
 */
export async function exportAtlasData({ layer, parameters: { scale, usedSprites } }: AtlasExportPipelineData): Promise<AtlasData> {
  const { name: directory } = layer;
  const atlas = convertAtlasData();
  const name = resolveAtlasName(layer);
  const staticAtlas = isAtlasStatic(layer);
  const images = staticAtlas ? layer.children : layer.images;
  usedSprites = staticAtlas ? usedSprites : [];
  const spriteData = await exportSpriteData(images, directory, scale, usedSprites);
  return {
    name,
    atlas,
    images: spriteData,
  };
}

/**
 * Exports sprite data.
 * @param images - The layers to export sprite data from.
 * @param directory - The directory where the sprite images are stored.
 * @param scale - The scale to export images at.
 * @returns The sprite data.
 */
async function exportSpriteData(images: readonly (SceneNode | SliceNode)[], directory: string, scale: number = 1, usedSprites: string[] = []): Promise<SpriteData[]> {
  const spriteData = [];
  for (const sprite of images) {
    if (shouldExportSprite(sprite, usedSprites)) {
      const exportedSprite = await exportSprite(sprite, directory, scale);
      spriteData.push(exportedSprite);
    }
  } 
  return spriteData;
}

function shouldExportSprite(layer: SceneNode, usedSprites: string[]) {
  return !usedSprites.length || usedSprites.includes(layer.id)
}

/**
 * Exports sprite data.
 * @param layer - The layer to export sprite data from.
 * @param directory - The directory where the sprite image is stored.
 * @param scale - The scale to export image at.
 * @returns The sprite data.
 */
async function exportSprite(layer: SceneNode, directory: string, scale: number = 1): Promise<SpriteData> {
  const sprite = convertSpriteData();
  const name = convertSpriteName(layer)
  const parameters = resolveExportParameters(layer, scale);
  const data = await layer.exportAsync(parameters)
  return {
    name,
    directory,
    sprite,
    data,
  };
}

function resolveExportParameters(layer: SceneNode, scale: number): ExportSettings {
  const format = "PNG";
  const constraint: ExportSettingsConstraints = { type: "SCALE", value: scale };
  const useAbsoluteBounds = isFigmaText(layer);
  return { format, useAbsoluteBounds, constraint };
}

/**
 * Packs the atlases with parameters for export.
 * @param layers - The atlases to pack.
 * @param scale - The scale to export images at.
 */
export function packAtlases(layers: AtlasLayer[], scale = 1, usedSprites: string[] = []) {
  return layers.map((layer) => packAtlas(layer, scale, usedSprites));

}

/**
 * Packs the atlas with parameters for export.
 * @param layer - The atlas to pack.
 * @param scale - The scale to export images at.
 */
export function packAtlas(layer: AtlasLayer, scale = 1, usedSprites: string[] = []): AtlasExportPipelineData {
  const parameters = { scale, usedSprites };
  return { layer, parameters };
}