/**
 * Handles texture data, including extraction and processing of it.
 * @packageDocumentation
 */

import { findMainFigmaComponent, getPluginData, hasChildren, isFigmaBox, isFigmaText, isFigmaComponentInstance, isFigmaSceneNode, isFigmaSlice, isLayerAtlas, isLayerContextSection, isLayerExportable } from "utilities/figma";
import { generateAtlasPath } from "utilities/path";
import { runVariantPipeline } from "utilities/variantPipeline";

const TEXTURE_VARIANT_PIPELINE: VariantPipeline<TextureVariantPipelineData, TextureResourceData> = {
  process: extractTextureData,
}

/**
 * Recursively extracts texture data from a tree of Figma layers.
 * @param layer - The Figma layer to generate texture data for.
 * @param skipVariants - Indicates if variants should be skipped.
 * @param textureData - The texture data to append to.
 * @returns The generated texture data.
 */
export async function extractTextureData(data: TextureVariantPipelineData, textureData: TextureResourceData = {}): Promise<TextureResourceData> {
  const { layer, skipVariants, textAsSprites } = data;
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
    } else if (textAsSprites && isFigmaText(layer)) {
      const atlasName = "text_layers";
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
          const parameters = { layer: child, skipVariants, textAsSprites };
          const childData = await extractTextureData(parameters, textureData);
          textureData = { ...textureData, ...childData };
        }
      }
      if (!skipVariants && isFigmaComponentInstance(layer)) {
        const parameters = { layer, skipVariants: true, textAsSprites };
        const variantData = await runVariantPipeline(TEXTURE_VARIANT_PIPELINE, parameters, textureData);
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
function processDynamicTextureData(layer: SliceNode | TextNode, atlasName: string): TextureResourceData {
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
async function processStaticTextureData(layer: InstanceNode): Promise<TextureResourceData> {
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
function updateStaticTextureData(atlas: ComponentSetNode): TextureResourceData {
  const { parent } = atlas;
  let textureData: TextureResourceData = {};
  const atlasData = getPluginData(atlas, "defoldAtlas"); 
  if (parent && isLayerContextSection(parent)) {
    const sectionData = getPluginData(parent, "defoldSection");
    if (sectionData?.bundled) {
      const extension = resolveExtension(atlasData, sectionData);
      const ignore = resolveIgnore(atlasData, sectionData);
      textureData = { ...textureData, ...generateStaticTextureData(atlas.name, atlas.id, ignore, extension) };
      for (const child of parent.children) {
        if (isFigmaSceneNode(child) && isLayerAtlas(child)) {
          const childData = getPluginData(child, "defoldAtlas");
          const childExtension = resolveExtension(childData, sectionData);
          const childIgnore = resolveIgnore(childData, sectionData);
          textureData = { ...textureData, ...generateStaticTextureData(child.name, child.id, childIgnore, childExtension) };
        }
      }
    } else if (sectionData?.jumbo) {
      const name = sectionData.jumbo;
      const extension = resolveExtension(null, sectionData);
      const ignore = resolveIgnore(null, sectionData);
      textureData = { ...textureData, ...generateStaticTextureData(name, parent.id, ignore, extension) };
    }
  } else {
    const extension = resolveExtension(atlasData, null);
    const ignore = resolveIgnore(atlasData, null);
    textureData = { ...textureData, ...generateStaticTextureData(atlas.name, atlas.id, ignore, extension) };
  }
  return textureData;
}

function resolveExtension(atlas: WithNull<PluginAtlasData>, section: WithNull<PluginSectionData>): string | undefined {
  return section?.extension || atlas?.extension || undefined;
}

function resolveIgnore(atlas: WithNull<PluginAtlasData>, section: WithNull<PluginSectionData>): boolean {
  return section?.ignore || atlas?.ignore || false;
}

/**
 * Generates static texture data for an atlas.
 * @param atlasName - The name of the atlas.
 * @param layer - The atlas to generate texture data for.
 * @returns The generated texture data.
 */
function generateStaticTextureData(atlasName: string, id: string, ignore: boolean, extension?: string): TextureResourceData {
  const path = generateAtlasPath(atlasName, extension);
  return {
    [atlasName]: {
      path,
      id,
      ignore,
    }
  };
}
