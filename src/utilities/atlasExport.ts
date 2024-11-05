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
export async function exportAtlasData({ layer, parameters: { scale } }: AtlasExportPipelineData): Promise<AtlasData> {
  const { name: directory } = layer;
  const name = resolveAtlasName(layer);
  const images = isAtlasStatic(layer) ? layer.children : layer.images;
  const atlas = convertAtlasData();
  const spriteData = await exportSpriteData(images, directory, scale);
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
async function exportSpriteData(images: readonly (SceneNode | SliceNode)[], directory: string, scale: number = 1): Promise<SpriteData[]> {
  const spriteExportPromises = images.map((sprite) => exportSprite(sprite, directory, scale))
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
async function exportSprite(layer: SceneNode, directory: string, scale: number = 1): Promise<SpriteData> {
  const sprite = convertSpriteData();
  const data = await layer.exportAsync({ format: "PNG", constraint: { type: "SCALE", value: scale } });
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
export function packAtlases(layers: AtlasLayer[], scale = 1) {
  return layers.map((layer) => packAtlas(layer, scale));

}

/**
 * Packs the atlas with parameters for export.
 * @param layer - The atlas to pack.
 * @param scale - The scale to export images at.
 */
export function packAtlas(layer: AtlasLayer, scale = 1) {
  const parameters = { scale };
  return { layer, parameters };
}