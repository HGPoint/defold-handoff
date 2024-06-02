/**
 * Utility module for generating GUI data.
 * @packageDocumentation
 */

import config from "config/config.json";
import { projectConfig } from "handoff/project";
import { getDefoldGUINodePluginData } from "utilities/gui";
import { setPluginData, findMainComponent, hasChildren, isAtlas, isAtlasSection, isFigmaSceneNode, isFigmaComponentInstance, isFigmaBox, isFigmaText, isExportable, isAtlasSprite, getPluginData, equalComponentProperties, equalExposedComponentProperties } from "utilities/figma";
import { vector4, areVectorsEqual, copyVector, addVectors } from "utilities/math";
import { convertGUIData, convertBoxGUINodeData, convertTextGUINodeData } from "utilities/guiDataConverters";
import { isSlice9PlaceholderLayer, findOriginalLayer, isSlice9Layer, isSlice9ServiceLayer, parseSlice9Data } from "utilities/slice9";
import { generateContextData } from "utilities/context";
import { generateAtlasPath, generateFontPath } from "utilities/path";
import { inferGUINode, inferTextNode } from "utilities/inference";
import { delay } from "utilities/delay";

/**
 * Checks if a layer is skippable based on export settings and type.
 * @param layer - The Figma layer to check.
 * @param gUINodeData - GUI node data of the layer.
 * @returns True if the layer is skippable, otherwise false.
 */
async function isSkippable(layer: ExportableLayer, gUINodeData: GUINodeData): Promise<boolean> {
  return gUINodeData.skip || layer.name.startsWith(projectConfig.autoskip) || isSlice9PlaceholderLayer(layer) || await isSpriteHolderLayer(layer);
}

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
      return true;
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
  } else if (isFigmaComponentInstance(options.layer)) {
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
async function generateForcedName(layer: ExportableLayer): Promise<string | undefined> {
  const { parent } = layer;
  if (parent && isExportable(parent) && await isSpriteHolderLayer(parent)) {
    return parent.name
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
  const forcedName = await generateForcedName(layer);
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
 * TODO: Refactor this function to make it more readable and maintainable. Also document it properly.
 */
async function generateGUINodeData(options: GUINodeDataExportOptions, guiNodesData?: GUINodeData[], clones?: ReturnType<typeof createClone>[]) {
  // Check if GUI node data array is provided
  if (guiNodesData) {
    // Retrieve the Figma layer from export options
    const { layer } = options;
    // Check if the layer is visible or a slice 9 layer
    if (layer.visible || isSlice9Layer(layer)) {
      // Process Figma box layers that are not slice 9 service layers
      if (isFigmaBox(layer) && !isSlice9ServiceLayer(layer)) {
        let alreadyCloned = false;
        await tryInferNode(layer);
        // Convert Figma box layer into GUI node data
        const guiNodeData = await convertBoxGUINodeData(layer, options);
        // Check if the layer shouldn't be excluded from export
        if (!guiNodeData.exclude) {
          // Check if the layer is cloneable and a Figma component instance
          if (guiNodeData.cloneable && isFigmaComponentInstance(layer)) {
            // Find the main component of the instance
            const mainComponent = await findMainComponent(layer);
            // Check if the layer has already been cloned
            if (mainComponent) {
              if (clones?.find((clone) => findClone(clone, mainComponent, layer))) {
                alreadyCloned = true;
              } else {
                if (!clones) {
                  clones = [];
                }
                // Create clone data and add it to the clones array
                const clone = createClone(mainComponent, layer);
                clones.push(clone);
              }
            }
          }
          // If not already cloned, proceed with processing the layer
          if (!alreadyCloned) {
            // Check if the layer should be skipped based on export settings
            const shouldSkip = await isSkippable(layer, guiNodeData);
            // If not skipped, add GUI node data to the array
            if (!shouldSkip) {
              guiNodesData.push(guiNodeData);
            }
            // Process children if the layer has any, and it's not a template, or at the root level and not a sprite holder
            if (hasChildren(layer) && (!guiNodeData.template || (options.atRoot && options.asTemplate)) && !await isAtlasSprite(layer)) {
              const { children: layerChildren } = layer;
              // If not skipped, initialize children array in GUI node data
              if (!shouldSkip) {
                guiNodeData.children = [];
              }
              // Determine the array to collect children GUI node data based on skip status
              const children = !shouldSkip ? guiNodeData.children : guiNodesData;
              // Process each child recursively
              for (const layerChild of layerChildren) {
                // Check if the child is exportable and not a slice   9 service layer
                if (isExportable(layerChild) && !isSlice9ServiceLayer(layer)) {
                  // Generate parent options for the child
                  const parentOptions = await generateParentOptions(layerChild, shouldSkip, shouldSkip && options.atRoot, options, guiNodeData);
                  // Recursively generate GUI node data for the child
                  await generateGUINodeData(parentOptions, children, clones);
                }
              }
              if (isFigmaComponentInstance(layer) && guiNodeData.export_variants) {
                const exportVariants = guiNodeData.export_variants.split(",");
                for (const exportVariant of exportVariants) {
                  let layerInstance: InstanceNode | undefined = undefined;
                  let initialValue: string | undefined = undefined;
                  const [exportVariantName, exportVariantValue] = exportVariant.split("=").map(value => value.trim());
                  if (layer.variantProperties && !!layer.variantProperties[exportVariantName]) {
                    layerInstance = layer;
                    initialValue = layer.variantProperties[exportVariantName];
                  } else {
                    const exposedInstance = layer.exposedInstances.find((instance) => instance.variantProperties && !!instance.variantProperties[exportVariantName]);
                    if (exposedInstance && exposedInstance.variantProperties && !!exposedInstance.variantProperties[exportVariantName]) {
                      layerInstance = exposedInstance;
                      initialValue = exposedInstance.variantProperties[exportVariantName];
                    }
                  }
                  if (!!layerInstance && !!initialValue) {
                    layerInstance.setProperties({ [exportVariantName]: exportVariantValue });
                    // Explicit delay to allow Figma to update the layer size after changing the variant
                    await delay(100);
                    // Recursively generate GUI node data for each exported variant
                    const { children: layerVariantChildren } = layer;
                    for (const layerVariantChild of layerVariantChildren) {
                      // Check if the child is exportable and not a slice   9 service layer
                      if (isExportable(layerVariantChild) && !isSlice9ServiceLayer(layer)) {
                        // Generate parent options for the child
                        const parentOptions = await generateParentOptions(layerVariantChild, shouldSkip, shouldSkip && options.atRoot, options, guiNodeData);
                        parentOptions.variantPrefix = exportVariantValue;
                        // Recursively generate GUI node data for the child
                        await generateGUINodeData(parentOptions, children, clones);
                      }
                    }
                    layerInstance.setProperties({ [exportVariantName]: initialValue });
                  }
                }
                if (children && children.length > 0) {
                  // Remove duplicate children left after exporting variants
                  const uniqueChildren = children.reduce((filteredChildren, child) => {
                    if (!filteredChildren.find(uniqueChild => {
                      return (
                        (uniqueChild.exportable_layer_id === child.exportable_layer_id) ||
                        (
                          uniqueChild.exportable_layer_name === child.exportable_layer_name &&
                          areVectorsEqual(uniqueChild.size, child.size) &&
                          areVectorsEqual(uniqueChild.position, child.position) &&
                          uniqueChild.texture === child.texture
                        )
                      )
                    })) {
                      filteredChildren.push(child);
                    }
                    return filteredChildren;
                  }, [] as GUINodeData[]);
                  children.splice(0, children.length, ...uniqueChildren);
                }
              }
            }
          }
        }
      }
      // Process Figma text layers
      else if (isFigmaText(layer)) {
        await tryInferNode(layer);
        // Convert Figma text layer into GUI node data and add to the array
        const guiNodeData = convertTextGUINodeData(layer, options);
        // Check if the layer shouldn't be excluded from export
        if (!guiNodeData.exclude) {
          guiNodesData.push(guiNodeData);
        }
      }
    }
  }
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
async function generateTexturesData(layer: SceneNode, texturesData: TextureData) {
  if (isFigmaBox(layer)) {
    if (isFigmaComponentInstance(layer)) {
      const mainComponent = await findMainComponent(layer);
      if (mainComponent) {
        const { parent: atlas } = mainComponent;
        if (isFigmaSceneNode(atlas) && isAtlas(atlas)) {
          updateTextureData(atlas, texturesData);
        }
      }
    }
    if (hasChildren(layer)) {
      for (const child of layer.children) {
        await generateTexturesData(child, texturesData);
      }
    }
  }
}

/**
 * Generates font data recursively for a given Figma layer and stores it in the provided font data object. If the layer is a text layer, generates font paths for each font family defined in the project configuration.
 * @async
 * @param layer - The Figma layer to generate font data for.
 * @param fontData - The object to store the generated font data.
 */
async function generateFontData(layer: SceneNode, fontData: FontData) {
  if (isFigmaBox(layer)) {
    if (hasChildren(layer)) {
      for (const child of layer.children) {
        await generateFontData(child, fontData);
      }
    }
  }
  if (isFigmaText(layer)) {
    for (const font of projectConfig.fontFamilies) {
      const path = generateFontPath(font);
      if (!fontData[font.name]) {
        fontData[font.name] = path;
      }
    }
    return;
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
          const data = getDefoldGUINodePluginData(originalLayer);
          setPluginData(originalLayer, { defoldGUINode: { ...data, slice9 } });
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

async function tryInferNode(layer: ExportableLayer) {
  const pluginData = getPluginData(layer, "defoldGUINode");
  if (!pluginData) {
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
    areVectorsEqual(parent.size, child.size) &&
    parent.type === child.type &&
    !parent.texture &&
    child.visible &&
    !!child.texture
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
}

/**
 * Recursively collapses GUI node data by merging collapsible child nodes into their parent nodes.
 * @param nodes - The array of GUI node data to collapse.
 * @param collapsedNodes - An array to collect the collapsed GUI node data.
 */
function collapseGUINodeData(nodes: GUINodeData[], collapsedNodes: GUINodeData[]) {
  for (const node of nodes) {
    collapsedNodes.push(node);
    if (node.children && !node.fixed) {
      const { children } = node;
      const collapsableChild = children.find(child => canCollapseNodes(node, child));
      if (collapsableChild) {
        collapseNodes(node, collapsableChild);
        const index = children.indexOf(collapsableChild);
        children.splice(index, 1);
      }
      collapseGUINodeData(children, collapsedNodes);
    }
  }
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
  tryInferNode(layer);
  const { name } = layer;
  const rootData = getPluginData(layer, "defoldGUINode");
  const rootOptions = generateRootOptions(layer, asTemplate);
  const gui = convertGUIData(rootData);
  const nodes: GUINodeData[] = [];
  const clones: GUINodeCloneData[] = [];
  await generateGUINodeData(rootOptions, nodes, clones);
  const collapsedNodes: GUINodeData[] = [];
  collapseGUINodeData(nodes, collapsedNodes);
  const textures: TextureData = {};
  await generateTexturesData(layer, textures);
  const fonts = {};
  await generateFontData(layer, fonts);
  const layers = generateLayersData(layer);
  const filePath = rootData?.path || config.guiNodeDefaultSpecialValues.path;
  return {
    name,
    gui,
    nodes: collapsedNodes,
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
