/**
 * Handles texture data, including extraction and processing of it.
 * @packageDocumentation
 */

import { findMainFigmaComponent, getPluginData, hasChildren, isFigmaBox, isFigmaComponentInstance, isFigmaSceneNode, isFigmaSlice, isLayerAtlas, isLayerContextSection, isLayerExportable } from "utilities/figma";
import { generateAtlasPath } from "utilities/path";
import { runVariantPipeline } from "utilities/variantPipeline";

const TEXTURE_VARIANT_PIPELINE: VariantPipeline<TextureVariantPipelineData, TextureData> = {
  process: extractTextureData,
}

/**
 * Recursively extracts texture data from a tree of Figma layers.
 * @param layer - The Figma layer to generate texture data for.
 * @param skipVariants - Indicates if variants should be skipped.
 * @param textureData - The texture data to append to.
 * @returns The generated texture data.
 */
export async function extractTextureData(data: TextureVariantPipelineData, textureData: TextureData = {}): Promise<TextureData> {
  const { layer, skipVariants } = data;
  if (isLayerExportable(layer)) {
    if (isFigmaComponentInstance(layer)) {
      const staticData = await processStaticTextureData(layer);
      textureData = { ...textureData, ...staticData };
    } else if (isFigmaSlice(layer)) {
      const { name: atlasName } = layer.parent ? layer.parent : layer;
      const dynamicData = processDynamicTextureData(layer, atlasName);
      if (shouldAppendDynamicTextureData(textureData[atlasName], layer.id)) {
        textureData[atlasName].sprites.ids.push(layer.id);
      } else {
        textureData = { ...textureData, ...dynamicData };
      }
    }
    if (isFigmaBox(layer)) {
      if (hasChildren(layer)) {
        for (const child of layer.children) {
          const childData = await extractTextureData({ layer: child, skipVariants: false }, textureData);
          textureData = { ...textureData, ...childData };
        }
      }
      if (!skipVariants && isFigmaComponentInstance(layer)) {
        const variantData = await runVariantPipeline(TEXTURE_VARIANT_PIPELINE, { layer, skipVariants: true }, textureData);
        textureData = { ...textureData, ...variantData };
      }
    }
  }
  return textureData;
}

function shouldAppendDynamicTextureData(textureAtlasData: TextureAtlasData, id: string): textureAtlasData is TextureDynamicAtlasData {
  return textureAtlasData && "sprites" in textureAtlasData && !textureAtlasData.sprites.ids.includes(id);
}

/**
 * Processes dynamic texture data for a Figma slice. 
 * @param layer - The Figma slice to process texture data for.
 * @param atlasName - The name of the atlas.
 * @returns The generated texture data.
 */
function processDynamicTextureData(layer: SliceNode, atlasName: string): TextureData {
  const path = generateAtlasPath(atlasName);
  return {
    [atlasName]: {
      path,
      sprites: {
        atlasName,
        ids: [layer.id],
      }
    }
  };
}

/**
 * Processes static texture data for an atlas sprite.
 * @param layer - The Figma layer to process texture data for.
 * @returns The generated texture data.
 */
async function processStaticTextureData(layer: InstanceNode): Promise<TextureData> {
  const mainComponent = await findMainFigmaComponent(layer);
  if (mainComponent) {
    const { parent } = mainComponent;
    if (parent && isLayerAtlas(parent)) {
      return updateStaticTextureData(parent);
    }
  }
  return {};
}

/**
 * Updates static texture data for an atlas.
 * @param atlas - The atlas to update texture data for.
 * @returns The updated texture data.
 */
function updateStaticTextureData(atlas: SceneNode): TextureData {
  const { parent } = atlas;
  let textureData: TextureData = {};
  if (parent && isLayerContextSection(parent)) {
    const sectionData = getPluginData(parent, "defoldSection");
    if (sectionData?.bundled) {
      textureData = { ...textureData, ...generateStaticTextureData(atlas.name, atlas) };
      for (const child of parent.children) {
        if (isFigmaSceneNode(child) && isLayerAtlas(child)) {
          textureData = { ...textureData, ...generateStaticTextureData(child.name, child) };
        }
      }
    } else if (sectionData?.jumbo) {
      const name = sectionData.jumbo;
      textureData = { ...textureData, ...generateStaticTextureData(name, parent) };
    }
  } else {
    textureData = { ...textureData, ...generateStaticTextureData(atlas.name, atlas) };
  }
  return textureData;
}

/**
 * Generates static texture data for an atlas.
 * @param atlasName - The name of the atlas.
 * @param layer - The atlas to generate texture data for.
 * @returns The generated texture data.
 */
function generateStaticTextureData(atlasName: string, layer: SceneNode): TextureData {
  const path = generateAtlasPath(atlasName);
  const { id } = layer;
  return {
    [atlasName]: {
      path,
      id
    }
  };
}
