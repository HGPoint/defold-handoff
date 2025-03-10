/**
 * 
 * @packageDocumentation
 */

import { findMainFigmaComponent, hasChildren, isFigmaBox, isFigmaComponentInstance, isLayerExportable, isLayerSprite, isVisible } from "utilities/figma";
import { isUsedSlice9Layer } from "utilities/slice9";
import { runVariantPipeline } from "utilities/variantPipeline";

const USED_SPRITE_VARIANT_PIPELINE: VariantPipeline<SpriteVariantPipelineData, SpriteResourceData> = {
  process: extractSpriteData,
}

export async function extractUsedSpriteData(layers: Exclude<ExportableLayer, SliceLayer>[], skipVariants: boolean) {
  const result = [];
  for (const layer of layers) {
    const spriteData = await extractSpriteData({ layer, skipVariants }); 
    result.push(...spriteData);
  }
  return result;
}

export async function extractSpriteData(data: SpriteVariantPipelineData, spriteData: SpriteResourceData = []) {
  const { layer, skipVariants } = data;
  if (isLayerExportable(layer)) {
    if ((isVisible(layer) || isUsedSlice9Layer(layer)) && await isLayerSprite(layer) && isFigmaComponentInstance(layer)) {
      const originalSprite = await findMainFigmaComponent(layer);
      if (originalSprite) {
        spriteData.push(originalSprite.id);
      }
    } else if (isFigmaBox(layer)) {
      if (hasChildren(layer)) {
        for (const child of layer.children) {
          await extractSpriteData({ layer: child, skipVariants }, spriteData);
        }
      }
      if (!skipVariants && isFigmaComponentInstance(layer)) {
        await runVariantPipeline(USED_SPRITE_VARIANT_PIPELINE, { layer, skipVariants: true }, spriteData);
      }
    }
  }
  return spriteData;
}

export function checkMeaningfulSpriteSize({ width, height }: { width: number, height: number }) {
  return width > 1 || height > 1;
}
