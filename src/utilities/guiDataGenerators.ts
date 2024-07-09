/**
 * Utility module for generating GUI data.
 * @packageDocumentation
 */

import config from "config/config.json";
import { projectConfig } from "handoff/project";
import { getDefoldGUINodePluginData } from "utilities/gui";
import { setPluginData, findMainComponent, hasChildren, isAtlas, isAtlasSection, isFigmaSceneNode, isFigmaComponentInstance, isFigmaBox, isFigmaText, isExportable, isAtlasSprite, getPluginData, equalComponentProperties, equalExposedComponentProperties, isFigmaComponent } from "utilities/figma";
import { vector4, areVectorsEqual, copyVector, addVectors } from "utilities/math";
import { convertGUIData, convertBoxGUINodeData, convertTextGUINodeData } from "utilities/guiDataConverters";
import { isSlice9PlaceholderLayer, findOriginalLayer, isSlice9Layer, isSlice9ServiceLayer, parseSlice9Data } from "utilities/slice9";
import { generateContextData } from "utilities/context";
import { generateAtlasPath, generateFontPath } from "utilities/path";
import { inferGUINode, inferTextNode } from "utilities/inference";
import { delay } from "utilities/delay";

/**
 * Checks if a layer is a sprite holder (layer is an instance of an atlas component set).
 * @param layer - The Figma layer to check.
 * @returns True if the layer is a sprite holder, otherwise false.
 */
async function isSpriteHolderLayer(layer: ExportableLayer): Promise<boolean> {
  if (isFigmaComponentInstance(layer)) {
    if (layer.children.length === 1) {
      const [child] = layer.children;
      if (!isSlice9PlaceholderLayer(child)) {
        const sameSize = layer.width === child.width && layer.height == child.height;        
        return sameSize && await isAtlasSprite(child);
      }
      return await isAtlasSprite(child);
    }
  }
  return false;
}

/**
 * Generates options for exporting the root GUI node data.
 * @param layer - The Figma layer at the root.
 * @returns Options for exporting the root GUI node data.
 */
function generateRootOptions(layer: ExportableLayer, asTemplate: boolean): GUINodeDataExportOptions {
  return {
    layer,
    atRoot: true,
    asTemplate,
    namePrefix: "",
    parentId: "",
    parentPivot: config.guiNodeDefaultValues.pivot,
    parentSize: vector4(0),
    parentShift: vector4(-layer.x, -layer.y, 0, 0),
    parentChildren: []
  }
}

/**
 * Resolves parent parameters the GUI node.
 * @param shouldSkip - Indicates if the node should be skipped.
 * @param parentOptions - Parent GUI node export options.
 * @param guiNodeData - GUI node data.
 * @returns Resolved parent parameters.
 */
function resolveParentParameters(shouldSkip: boolean, parentOptions: GUINodeDataExportOptions, guiNodeData: GUINodeData): Pick<GUINodeDataExportOptions, "parentId" | "parentPivot" | "parentSize" | "parentShift" | "parentChildren"> {
  if (shouldSkip) {
    const { parentId, parentSize, parentPivot, parentShift, parentChildren } = parentOptions;
    return {
      parentId: parentId,
      parentSize: parentSize,
      parentPivot: parentPivot,
      parentShift: addVectors(parentShift, guiNodeData.figma_position),
      parentChildren: parentChildren
    }
  }
  return {
    parentId: guiNodeData.id,
    parentSize: guiNodeData.size,
    parentPivot: guiNodeData.pivot,
    parentShift: vector4(0),
    parentChildren: guiNodeData.children
  }
}

/**
 * Generates a prefix for the node name.
 * @param shouldSkip - Indicates if the node should be skipped.
 * @param options - Export options.
 * @returns The generated name prefix.
 */
function generateNamePrefix(shouldSkip: boolean, options: GUINodeDataExportOptions): string {
  if (shouldSkip) {
    if (options.namePrefix) {
      return options.namePrefix;
    }
    return "";
  } else if (isFigmaComponentInstance(options.layer) || isFigmaComponent(options.layer)) {
    if (options.namePrefix) {
      return `${options.namePrefix}${options.layer.name}_`;
    }
    return `${options.layer.name}_`;
  } if (options.namePrefix) {
    return options.namePrefix;
  }
  return "";
}

/**
 * Tries to generate a forced name for a layer.
 * @param layer - The Figma layer.
 * @returns Forced name if found, otherwise undefined.
 */
async function generateForcedName(layer: ExportableLayer, parentOptions: GUINodeDataExportOptions, parentGUINodeData: GUINodeData): Promise<string | undefined> {
  const { parent } = layer;
  if (parent) {
    if (parentGUINodeData.skip && parentOptions.forcedName && isSlice9PlaceholderLayer(parent)) {
      return parentOptions.forcedName;
    }
    if (isExportable(parent) && await isSpriteHolderLayer(parent)) {
      return parent.name
    }
  }
  return undefined;
}

/**
 * Generates options for exporting GUI node data for a parent node.
 * @param  layer - The Figma layer.
 * @param  shouldSkip - Indicates if the layer should be skipped.
 * @param  atRoot - Indicates if the layer is at the root.
 * @param  parentOptions - Parent GUI node export options.
 * @param  parentGUINodeData - GUI node data of the parent node.
 * @returns Parent options.
 */
async function generateParentOptions(layer: ExportableLayer, shouldSkip: boolean, atRoot: boolean, parentOptions: GUINodeDataExportOptions, parentGUINodeData: GUINodeData): Promise<GUINodeDataExportOptions> {
  const namePrefix = generateNamePrefix(shouldSkip, parentOptions);
  const forcedName = await generateForcedName(layer, parentOptions, parentGUINodeData);
  const parentParameters = resolveParentParameters(shouldSkip, parentOptions, parentGUINodeData);
  return {
    layer,
    atRoot,
    asTemplate: parentOptions.asTemplate,
    namePrefix,
    variantPrefix: parentOptions.variantPrefix,
    forcedName,
    ...parentParameters,
  }
}

/**
 * Creates data for a clone of a Figma component.
 * @param mainComponent - The main Figma component.
 * @param clone - The clone of the component.
 * @returns Data for the clone.
 */
function createClone(mainComponent: ComponentNode, clone: InstanceNode): GUINodeCloneData {
  return {
    cloneOf: mainComponent,
    cloneInstance: clone,
  }
}

/**
 * Checks if a matching clone is found.
 * @param data - Clone data to compare.
 * @param mainComponent - The main Figma component.
 * @param layer - The Figma instance layer.
 * @returns True if a matching clone is found, otherwise false.
 */
function findClone(data: GUINodeCloneData, mainComponent: ComponentNode, layer: InstanceNode) {
  return (
    data.cloneOf === mainComponent &&
    equalComponentProperties(data.cloneInstance.componentProperties, layer.componentProperties) &&
    equalExposedComponentProperties(data.cloneInstance.exposedInstances, layer.exposedInstances)
  );
}

/**
 * Generates GUI node data recursively for a given layer.
 * @param options - Export options for the GUI node.
 * @param guiNodesData - Array to collect GUI node data.
 * @param clones - Array to collect clones.
 */
async function generateGUINodeData(options: GUINodeDataExportOptions, guiNodesData: GUINodeData[], clones?: GUINodeCloneData[]) {
  if (guiNodesData) {
    const { layer } = options;
    if (canProcessGUIBoxNode(layer)) {
      await generateGUIBoxNodeData(layer, options, guiNodesData, clones);
    } else if (canProcessGUITextNode(layer)) {
      await generateGUITextNodeData(layer, options, guiNodesData)
    }
  }
}

/**
 * Checks if a layer can be processed as a GUI box node.
 * @param layer - The Figma layer to check.
 * @returns True if the layer can be processed as a GUI box node, otherwise false.
 */
function canProcessGUIBoxNode(layer: ExportableLayer): layer is FrameNode | ComponentNode | InstanceNode {
  return isFigmaBox(layer) && !isSlice9ServiceLayer(layer) && (layer.visible || isSlice9Layer(layer))
}

/**
 * Generates GUI node data for a box layer.
 * @param layer - The Figma layer to generate GUI node data for.
 * @param options - Export options for the GUI node.
 * @param guiNodesData - Array to collect GUI node data.
 * @param clones - Array to collect clones.
 */
async function generateGUIBoxNodeData(layer: BoxLayer, options: GUINodeDataExportOptions, guiNodesData: GUINodeData[], clones?: GUINodeCloneData[]) {
  await tryInferNode(layer);
  const guiNodeData = await convertBoxGUINodeData(layer, options);
  if (!guiNodeData.exclude) {
    const alreadyCloned = await isClonedLayer(layer, guiNodeData, clones);
    if (!alreadyCloned) {
      const shouldSkip = await isSkippableLayer(layer, guiNodeData);
      if (!shouldSkip) {
        guiNodesData.push(guiNodeData);
      }
      if (await shouldProcessGUINodeChildren(layer, guiNodeData, options)) {
        await processGUIBoxNodeChildren(layer, guiNodeData, shouldSkip, options, guiNodesData, clones);
      }
      if (shouldProcessVariants(layer, guiNodeData, options)) {
        await processGUIBoxNodeVariants(layer, guiNodeData, options, guiNodesData, shouldSkip, clones);
      }
    }
  }
}

/**
 * Checks if a layer is skippable based on export settings and type.
 * @param layer - The Figma layer to check.
 * @param gUINodeData - GUI node data of the layer.
 * @returns True if the layer is skippable, otherwise false.
 */
async function isSkippableLayer(layer: ExportableLayer, gUINodeData: GUINodeData): Promise<boolean> {
  return (
    gUINodeData.skip ||
    layer.name.startsWith(projectConfig.autoskip) ||
    isSlice9PlaceholderLayer(layer) ||
    await isSpriteHolderLayer(layer)
  );
}

/**
 * Checks if a layer was already cloned.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is an already cloned layer, otherwise false.
 */
async function isClonedLayer(layer: BoxLayer, guiNodeData: GUINodeData, clones?: GUINodeCloneData[]) {
  if (guiNodeData.cloneable && isFigmaComponentInstance(layer)) {
    const mainComponent = await findMainComponent(layer);
    if (mainComponent) {
      if (clones?.find((clone) => findClone(clone, mainComponent, layer))) {
        return true;
      } else {
        if (!clones) {
          clones = [];
        }
        const clone = createClone(mainComponent, layer);
        clones.push(clone);
      }
    }
  }
  return false;
}

/**
 * Checks if a layer has children that should be processed as GUI nodes.
 * @param layer - The Figma layer to check.
 * @returns True if the layer has children that should be processed, otherwise false.
 */
async function shouldProcessGUINodeChildren(layer: BoxLayer, guiNodeData: GUINodeData, options: GUINodeDataExportOptions) {
  return hasChildren(layer) && (!guiNodeData.template || (options.atRoot && options.asTemplate)) && !await isAtlasSprite(layer)
}

/**
 * Processes children of a GUI box node.
 * @param layer - The Figma layer to process children for.
 * @param guiNodeData - GUI node data of the layer.
 * @param shouldSkip - Indicates if the layer should be skipped.
 * @param options - Export options for the GUI node.
 * @param guiNodesData - Array to collect GUI node data.
 * @param clones - Array to collect clones.
 */
async function processGUIBoxNodeChildren(layer: BoxLayer, guiNodeData: GUINodeData, shouldSkip: boolean, options: GUINodeDataExportOptions, guiNodesData: GUINodeData[], clones?: GUINodeCloneData[]) {
  const nodeChildren = !shouldSkip ? [] : guiNodesData;
  const { children } = layer;
  if (!shouldSkip) {
    guiNodeData.children = nodeChildren;
  }
  for (const child of children) {
    if (shouldProcessChildLayer(child)) {
      const parentOptions = await generateParentOptions(child, shouldSkip, shouldSkip && options.atRoot, options, guiNodeData);
      await generateGUINodeData(parentOptions, nodeChildren, clones);
    }
  }
}

/** 
 * Checks if a child layer should be processed as a GUI node.
 * @param layer - The Figma layer to check.
 * @returns True if the layer should be processed as a GUI node, otherwise false.
 */
function shouldProcessChildLayer(layer: SceneNode): layer is ExportableLayer {
  return isExportable(layer) && !isSlice9ServiceLayer(layer);
}

/**
 * Checks if bundled variants for the layer should be processed.
 * @param layer - The Figma layer to check.
 * @param guiNodeData - GUI node data of the layer.
 * @param options - Export options for the GUI node.
 * @returns True if there are bundled variants that should be processed, otherwise false.
 */
function shouldProcessVariants(layer: SceneNode, guiNodeData: GUINodeData, options: GUINodeDataExportOptions): layer is InstanceNode {
  return isFigmaComponentInstance(layer) && !options.variantPrefix && !!guiNodeData.export_variants
}

/**
 * Processes bundled variants for a GUI box node.
 * @param layer - The Figma layer to process variants for.
 * @param guiNodeData - GUI node data of the layer.
 * @param options - Export options for the GUI node.
 * @param guiNodesData - Array to collect GUI node data.
 * @param clones - Array to collect clones.
 */
async function processGUIBoxNodeVariants(layer: InstanceNode, guiNodeData: GUINodeData, options: GUINodeDataExportOptions, guiNodesData: GUINodeData[], shouldSkip: boolean, clones?: GUINodeCloneData[]) {
  const exportVariants = resolveExportVariants(guiNodeData.export_variants);
  for (const exportVariant of exportVariants) {
    const [ exportVariantName, exportVariantValue ] = resolveExportVariantComponents(exportVariant);
    const variantOptions = resolveVariantOptions(layer, exportVariantName);
    if (variantOptions) {
      const { variantLayer, variantInitialValue } = variantOptions;
      variantLayer.setProperties({ [exportVariantName]: exportVariantValue });
      await delay(100);
      await tryInferNode(layer);
      options.variantPrefix = exportVariantValue;
      await generateGUINodeData(options, guiNodesData, clones);
      variantLayer.setProperties({ [exportVariantName]: variantInitialValue });
    }
  }
}

/**
 * Resolves export variants for a layer.
 * @param exportVariants - The export variants to resolve.
 * @returns Export variants.
 */
function resolveExportVariants(exportVariants: string) {
  return exportVariants.split(",");
}

/**
 * Resolves components of a bundled variant.
 * @param exportVariant - The bundled variant to resolve.
 * @returns Components of the bundled variant.
 */ 
function resolveExportVariantComponents(exportVariant: string) {
  return exportVariant.split("=").map(value => value.trim());
}

/**
 * Resolves variant options for a layer.
 * @param layer - The Figma layer.
 * @param exportVariantName - The name of the export variant.
 * @returns Variant options - layer and initial variant value.
 */
function resolveVariantOptions(layer: InstanceNode, exportVariantName: string) {
  if (layer.variantProperties && !!layer.variantProperties[exportVariantName]) {
    return {
      variantLayer: layer,
      variantInitialValue: layer.variantProperties[exportVariantName]
    }
  }
  const exposedInstance = layer.exposedInstances.find((instance) => instance.variantProperties && !!instance.variantProperties[exportVariantName]);
  if (exposedInstance && exposedInstance.variantProperties && !!exposedInstance.variantProperties[exportVariantName]) {
    return {
      variantLayer: exposedInstance,
      variantInitialValue: exposedInstance.variantProperties[exportVariantName]
    }
  }
  return null
}

/**
 * Generates GUI node data for a text layer.
 * @param layer - The Figma layer to generate GUI node data for.
 * @param options - Export options for the GUI node.
 * @param guiNodesData - Array to collect GUI node data.
 */
async function generateGUITextNodeData(layer: TextNode, options: GUINodeDataExportOptions, guiNodesData: GUINodeData[]) {
  await tryInferNode(layer);
  const guiNodeData = convertTextGUINodeData(layer, options);
  if (!guiNodeData.exclude) {
    guiNodesData.push(guiNodeData);
  }
}

/**
 * Checks if a layer can be processed as a GUI text node.
 * @param layer - The Figma layer to check.
 * @returns True if the layer can be processed as a GUI text node, otherwise false.
 */
function canProcessGUITextNode(layer: TextNode): layer is TextNode {
  return isFigmaText(layer) && layer.visible
}

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
 * Generates texture data recursively for a given Figma layer and stores it in the provided texture data object.
 * @param layer - The Figma layer.
 * @param texturesData - Object to store texture data.
 */
async function generateTexturesData(layer: SceneNode, texturesData: TextureData, skipVariants = false) {
  if (isFigmaBox(layer)) {
    if (isFigmaComponentInstance(layer)) {
      await processTextureData(layer, texturesData);
    }
    if (hasChildren(layer)) {
      await processChildrenTextureData(layer, texturesData);
    }
    await tryProcessVariantsTextureData(layer, texturesData, skipVariants);
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
 * Tries to generate texture data for bundled variants of a given layer.
 * @param layer - The Figma layer for whose bundled variants texture data should be generated.
 * @param texturesData - Object to store texture data.
 * @param skipVariants - Indicates if variants should be skipped. 
 */
async function tryProcessVariantsTextureData(layer: BoxLayer, texturesData: TextureData, skipVariants: boolean) {
  const pluginData = getPluginData(layer, "defoldGUINode");
  if (pluginData && shouldProcessVariantTextureData(layer, pluginData, skipVariants)) {
    const exportVariants = resolveExportVariants(pluginData.export_variants);
    for (const exportVariant of exportVariants) {
      const [exportVariantName, exportVariantValue] = resolveExportVariantComponents(exportVariant);
      const variantOptions = resolveVariantOptions(layer, exportVariantName);
      if (variantOptions) {
        const { variantLayer, variantInitialValue } = variantOptions;
        variantLayer.setProperties({ [exportVariantName]: exportVariantValue });
        await delay(100);
        await tryInferNode(layer);
        await generateTexturesData(layer, texturesData, true);
        variantLayer.setProperties({ [exportVariantName]: variantInitialValue });
      }
    }
  }
}

/**
 * Checks if texture data should be processed for bundled variants of a given layer
 * @param layer - The Figma layer to check.
 * @param pluginData - Plugin data of the layer.
 * @param skipVariants - Indicates if variants should be skipped.
 * @returns True if texture data should be processed for bundled variants, otherwise false.
 */
function shouldProcessVariantTextureData(layer: BoxLayer, pluginData: PluginGUINodeData, skipVariants: boolean): layer is InstanceNode {
  return isFigmaComponentInstance(layer) && !skipVariants && !!pluginData.export_variants;
}

/**
 * Generates font data recursively for a given Figma layer and stores it in the provided font data object. If the layer is a text layer, generates font paths for each font family defined in the project configuration.
 * @async
 * @param layer - The Figma layer to generate font data for.
 * @param fontData - The object to store the generated font data.
 */
async function generateFontData(layer: SceneNode, fontData: FontData, skipVariants = false) {
  if (isFigmaBox(layer)) {
    if (hasChildren(layer)) {
      await processChildrenFontData(layer, fontData);
    }
    await tryProcessVariantsFontData(layer, fontData, skipVariants);
  }
  if (isFigmaText(layer)) {
    processFontData(fontData);
    return;
  }
}

/**
 * Processes font data for the children of a given layer.
 * @param layer - The Figma layer for whose children font data should be processed.
 * @param fontData - The object to store the generated font data.
 */
async function processChildrenFontData(layer: BoxLayer, fontData: FontData) {
  for (const child of layer.children) {
    await generateFontData(child, fontData);
  }
}

/**
 * Tries to generate font data for bundled variants of a given layer.
 * @param layer - The Figma layer for whose bundled variants font data should be generated.
 * @param fontData - The object to store the generated font data.
 * @param skipVariants - Indicates if variants should be skipped. 
 */
async function tryProcessVariantsFontData(layer: BoxLayer, fontData: FontData, skipVariants: boolean) {
  const pluginData = getPluginData(layer, "defoldGUINode");
  if (pluginData && shouldProcessVariantsFontData(layer, pluginData, skipVariants)) {
    const exportVariants = resolveExportVariants(pluginData.export_variants);
    for (const exportVariant of exportVariants) {
      const [exportVariantName, exportVariantValue] = resolveExportVariantComponents(exportVariant);
      const variantOptions = resolveVariantOptions(layer, exportVariantName);
      if (variantOptions) {
        const { variantLayer, variantInitialValue } = variantOptions;
        variantLayer.setProperties({ [exportVariantName]: exportVariantValue });
        await delay(100);
        await tryInferNode(layer);
        await generateFontData(layer, fontData, true);
        variantLayer.setProperties({ [exportVariantName]: variantInitialValue });
      }
    }
  }
}

/**
 * Checks if font data should be processed for bundled variants of a given layer.
 * @param layer - The Figma layer to check.
 * @param pluginData - Plugin data of the layer.
 * @param skipVariants - Indicates if variants should be skipped.
 * @returns True if font data should be processed for bundled variants, otherwise false.
 */
function shouldProcessVariantsFontData(layer: BoxLayer, pluginData: PluginGUINodeData, skipVariants: boolean): layer is InstanceNode {
  return isFigmaComponentInstance(layer) && !skipVariants && !!pluginData.export_variants
}

/**
 * Processes font data for a given layer.
 * @param fontData - The object to store the generated font data.
 */
function processFontData(fontData: FontData) {
  for (const font of projectConfig.fontFamilies) {
    const path = generateFontPath(font);
    if (!fontData[font.name]) {
      fontData[font.name] = path;
    }
  }
}

/**
 * Generates layers data from shared GUI context data.
 * @param layer - The Figma layer generate shared GUI context data from.
 * @returns An array of layer names.
 */
function generateLayersData(layer: ExportableLayer) {
  const context = generateContextData(layer);
  return context.layers.reduce((layers, layerData) => {
    if (layerData.id === "DEFAULT") {
      return layers;
    }
    return [ ...layers, layerData.name ];
  }, [] as string[]);
}

/**
 * Tries to restore slice9 data for a given box layer and its children.
 * @param layer - The Figma layer to try restoring slice 9 data for.
 */
async function tryRestoreSlice9Data(layer: ExportableLayer) {
  if (isFigmaBox(layer)) {
    if (isSlice9PlaceholderLayer(layer)) {
      const originalLayer = findOriginalLayer(layer);
      if (originalLayer) {
        const slice9 = parseSlice9Data(layer);
        if (slice9) {
          setPluginData(originalLayer, { defoldSlice9: true });
          const guiNodeData = { defoldGUINode: { ...getDefoldGUINodePluginData(originalLayer), slice9 } };
          setPluginData(originalLayer, guiNodeData);
        }
      }
    }
    if (hasChildren(layer)) {
      for (const child of layer.children) {
        if (isFigmaBox(child)) {
          await tryRestoreSlice9Data(child);
        }
      }
    }
  }
}

/**
 * Tries to infer GUI node data for a given layer.
 * @param layer - The Figma layer to try inferring GUI node data for.
 */
async function tryInferNode(layer: ExportableLayer) {
  const pluginData = getPluginData(layer, "defoldGUINode");
  if (!pluginData?.inferred) {
    if (isFigmaBox(layer)) {
      await inferGUINode(layer);
    } else if (isFigmaText(layer)) {
      inferTextNode(layer);
    }
  }
}

/**
 * Checks if a child node can be collapsed into its parent based on certain criteria.
 * @param parent - The parent GUI node.
 * @param child - The child GUI node.
 * @returns True if the child node can be collapsed into the parent, otherwise false.
 */
function canCollapseNodes(parent: GUINodeData, child: GUINodeData): boolean {
  return (
    !child.fixed &&
    areVectorsEqual(parent.size, child.size) &&
    parent.type === child.type &&
    !parent.texture &&
    (
      (child.visible && !!child.texture) ||
      !child.visible
    )
  );
}

/**
 * Collapses a child GUI node into its parent node by transferring certain properties.
 * @param parent - The parent GUI node to collapse into.
 * @param child - The child GUI node to collapse.
 */
function collapseNodes(parent: GUINodeData, child: GUINodeData) {
  parent.visible = true;
  parent.texture = child.texture;
  parent.color = child.color;
  parent.size_mode = child.size_mode;
  parent.slice9 = copyVector(child.slice9);
  parent.material = child.material;
  parent.adjust_mode = child.adjust_mode;
  parent.blend_mode = child.blend_mode;
  if (child.children) {
    if (!parent.children) {
      parent.children = [];
    }
    for (const collapsedChild of child.children) {
      collapsedChild.parent = parent.id;
      parent.children.push(collapsedChild);
    }
  }
}

/**
 * Recursively collapses GUI node data by merging collapsible child nodes into their parent nodes.
 * @param nodes - The array of GUI node data to collapse.
 * @returns The array of collapsed GUI node data.
 */
function collapseGUINodeData(node: GUINodeData) {
  if (!node.children || node.children.length === 0) {
    return node;
  }
  node.children = node.children.map(collapseGUINodeData);
  for (let index = 0; index < node.children.length; index++) {
    const child = node.children[index];
    if (canCollapseNodes(node, child)) {
      collapseNodes(node, child);
      node.children.splice(index, 1);
      break;
    }
  }
  return node;
}

/**
 * Flattens a tree of GUI node data by recursively including all children nodes.
 * @param nodes - The array (tree) of GUI node data to flatten.
 * @returns The flattened array of GUI node data.
 */
function flattenGUINodeData(nodes: GUINodeData[]): GUINodeData[] {
  const flatNodes = [];
  for (const node of nodes) {
    flatNodes.push(node);
    if (node.children && node.children.length > 0) {
      flatNodes.push(...flattenGUINodeData(node.children));
    }
  }
  return flatNodes;

}

/**
 * Generates GUI data for a given Figma layer, including GUI node data, textures, and fonts.
 * @async
 * @param layer - The Figma layer to generate GUI data for.
 * @returns GUI data.
 */
export async function generateGUIData(nodeExport: GUINodeExport): Promise<GUIData> {
  const { layer, asTemplate } = nodeExport;
  tryRestoreSlice9Data(layer);
  const { name } = layer;
  const rootData = getPluginData(layer, "defoldGUINode");
  const rootOptions = generateRootOptions(layer, asTemplate);
  const gui = convertGUIData(rootData);
  const nodes: GUINodeData[] = [];
  const clones: GUINodeCloneData[] = [];
  await generateGUINodeData(rootOptions, nodes, clones);
  const collapsedNodes = nodes.map(collapseGUINodeData);
  const flatNodes = flattenGUINodeData(collapsedNodes);
  const textures: TextureData = {};
  await generateTexturesData(layer, textures);
  const fonts = {};
  await generateFontData(layer, fonts);
  const layers = generateLayersData(layer);
  const filePath = rootData?.path || config.guiNodeDefaultSpecialValues.path;
  return {
    name,
    gui,
    nodes: flatNodes,
    textures,
    fonts,
    layers,
    filePath,
    asTemplate
  };
}

export async function generateGUIDataSet(layers: GUINodeExport[]): Promise<GUIData[]> {
  const guiNodesDataSets = layers.map(generateGUIData);
  return Promise.all(guiNodesDataSets);
}
