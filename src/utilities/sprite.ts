import { findMainFigmaComponent, hasChildren, isFigmaBox, isFigmaComponentInstance, isLayerExportable, isLayerSprite } from "utilities/figma";
import { runVariantPipeline } from "utilities/variantPipeline";

const USED_SPRITE_VARIANT_PIPELINE: VariantPipeline<SpriteVariantPipelineData, SpriteResourceData> = {
  process: extractSpriteData,
}

export async function extractUsedSpriteData(layers: Exclude<ExportableLayer, SliceLayer>[]) {
  const result = [];
  for (const layer of layers) {
    const spriteData = await extractSpriteData({ layer, skipVariants: false }); 
    result.push(...spriteData);
  }
  return result;
}

export async function extractSpriteData(data: SpriteVariantPipelineData, spriteData: SpriteResourceData = []) {
  const { layer, skipVariants } = data;
  if (isLayerExportable(layer)) {
    if (await isLayerSprite(layer) && isFigmaComponentInstance(layer)) {
      const originalSprite = await findMainFigmaComponent(layer);
      if (originalSprite) {
        spriteData.push(originalSprite.id);
      }
    } else if (isFigmaBox(layer)) {
      if (hasChildren(layer)) {
        for (const child of layer.children) {
          await extractSpriteData({ layer: child, skipVariants: false }, spriteData);
        }
      }
      if (!skipVariants && isFigmaComponentInstance(layer)) {
        await runVariantPipeline(USED_SPRITE_VARIANT_PIPELINE, { layer, skipVariants: true }, spriteData);
      }
    }
  }
  return spriteData;
}