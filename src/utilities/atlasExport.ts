/**
 * Handles atlas data export.
 * @packageDocumentation
 */

import { isAtlasStatic, resolveAtlasName } from "utilities/atlas";
import { convertAtlasData, convertSpriteData } from "utilities/atlasConversion";

/**
 * Exports atlas data.
 * @param layer - The layer to export atlas data from.
 * @param scale - The scale to export images at.
 * @returns The atlas data.
 */
export async function exportAtlasData({ layer, parameters: { scale, usedSprites } }: AtlasExportPipelineData): Promise<AtlasData> {
  const { name: directory } = layer;
  const name = resolveAtlasName(layer);
  const images = isAtlasStatic(layer) ? layer.children : layer.images;
  const atlas = convertAtlasData();
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
  const spriteExportPromises = images.map((sprite) => exportSprite(sprite, directory, scale, usedSprites))
  const spriteData = await Promise.all(spriteExportPromises);
  return spriteData;
}

/**
 * Exports sprite data.
 * @param layer - The layer to export sprite data from.
 * @param directory - The directory where the sprite image is stored.
 * @param scale - The scale to export image at.
 * @returns The sprite data.
 */
async function exportSprite(layer: SceneNode, directory: string, scale: number = 1, usedSprites: string[] = []): Promise<SpriteData> {
  const sprite = convertSpriteData();
  const shouldExport = usedSprites.length === 0 || usedSprites.includes(layer.id);
  const data: WithNull<Uint8Array<ArrayBufferLike>> = shouldExport ? await layer.exportAsync({ format: "PNG", constraint: { type: "SCALE", value: scale } }) : null;
  const name = layer.name.replace("Sprite=", "");
  return {
    name,
    directory,
    sprite,
    data,
  };
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