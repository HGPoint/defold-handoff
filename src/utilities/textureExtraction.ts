import { findMainComponent, hasChildren, isAtlas, isAtlasSection, isFigmaSceneNode, isFigmaComponentInstance, isFigmaBox, getPluginData, isFigmaSlice, isExportable } from "utilities/figma";
import { generateAtlasPath } from "utilities/path";

/**
 * Generates texture data for a given layer.
 * @param name - The name of the texture.
 * @param layer - The Figma layer.
 * @param texturesData - Object to store texture data.
 */
function generateTextureData(name: string, layer: SceneNode, texturesData: TextureData) {
  if (!texturesData[name]) {
    const path = generateAtlasPath(name);
    const { id } = layer;
    texturesData[name] = {
      path,
      id
    };
  }
}

/**
 * Updates texture data for an atlas node.
 * @param atlas - The atlas layer.
 * @param texturesData - Object to store texture data.
 */
function updateTextureData(atlas: SceneNode, texturesData: TextureData) {
  const { parent: section } = atlas
  if (isFigmaSceneNode(section) && isAtlasSection(section)) {
    const sectionData = getPluginData(section, "defoldSection");
    if (sectionData?.bundled) {
      generateTextureData(atlas.name, atlas, texturesData);
      for (const child of section.children) {
        if (isFigmaSceneNode(child) && isAtlas(child)) {
          generateTextureData(child.name, child, texturesData);
        }
      }
    } else if (sectionData?.jumbo) {
      const name = sectionData?.jumbo;
      generateTextureData(name, section, texturesData);
    }
  } else {
    generateTextureData(atlas.name, atlas, texturesData);
  }
}

/**
 * Processes texture data for a given layer.
 * @param layer - The Figma layer to process texture data for.
 * @param texturesData - Object to store texture data.
 */
async function processTextureData(layer: InstanceNode, texturesData: TextureData) {
  const mainComponent = await findMainComponent(layer);
  if (mainComponent) {
    const { parent: atlas } = mainComponent;
    if (isFigmaSceneNode(atlas) && isAtlas(atlas)) {
      updateTextureData(atlas, texturesData);
    }
  }
}

function processDynamicTextureData(layer: SliceNode, texturesData: TextureData) {
  const atlasName = layer.parent ? layer.parent.name : layer.name;
  if (!texturesData[atlasName]) {
    const path = generateAtlasPath(atlasName);
    texturesData[atlasName] = {
      path,
      sprites: {
        atlasName,
        ids: [layer.id],
      },
    };
  }
  if ('sprites' in texturesData[atlasName]) {
    texturesData[atlasName].sprites.ids.push(layer.id);
  }
}

/**
 * Processes texture data for the children of a given layer.
 * @param layer - The Figma layer to process texture data for its children.
 * @param texturesData - Object to store texture data.
 */
async function processChildrenTextureData(layer: BoxLayer, texturesData: TextureData) {
  for (const child of layer.children) {
    await generateTexturesData(child, texturesData);
  }
}

/**
 * Generates texture data recursively for a given Figma layer and stores it in the provided texture data object.
 * @param layer - The Figma layer.
 * @param texturesData - Object to store texture data.
 */
export async function generateTexturesData(layer: SceneNode, texturesData: TextureData, variantExtractor?: VariantExtractor | null, skipVariants = false) {
  if (isExportable(layer)) {
    if (isFigmaComponentInstance(layer)) {
      await processTextureData(layer, texturesData);
    }
    if (isFigmaSlice(layer)) {
      processDynamicTextureData(layer, texturesData);
    }
    if (isFigmaBox(layer)) {
      if (hasChildren(layer)) {
        await processChildrenTextureData(layer, texturesData);
      }
      if (variantExtractor) {
        await variantExtractor(layer, texturesData, skipVariants);
      }
    }
  }
}