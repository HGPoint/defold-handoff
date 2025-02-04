/**
 * Handles GUI-related data export.
 * @packageDocumentation
 */

import config from "config/config.json";
import { findAtlases, reduceAtlasIdsFromResources } from "utilities/atlas";
import { canProcessChildLayer, isLayerSkippable } from "utilities/data";
import delay from "utilities/delay";
import { areEqualComponentPropertySets, equalExposedComponentProperties, findMainFigmaComponent, getPluginData, hasChildren, isFigmaBox, isFigmaComponentInstance, isFigmaSlice, isFigmaText, isLayerData, isLayerSprite, isVisible } from "utilities/figma";
import { extractFontData } from "utilities/font";
import { isGUITemplate, resolveGUIFilePath, resolveGUINodeForcedName, resolveGUINodeNamePrefix, resolveGUINodePluginData } from "utilities/gui";
import { convertBoxGUINodeData, convertGUIData, convertTextGUINodeData, convertTextSpriteGUINodeData } from "utilities/guiConversion";
import { inferGUIBox, inferGUIText } from "utilities/inference";
import { extractLayerData } from "utilities/layer";
import { addVectors, isZeroVector, vector4 } from "utilities/math";
import { isSlice9Layer, isSlice9ServiceLayer } from "utilities/slice9";
import { generateSpineBoneData, generateSpineSkinData, generateSpineSlotData, resolveSpineFilePath, resolveSpineSkeletonData } from "utilities/spine";
import { extractTextureData } from "utilities/texture";
import { extractExportVariants, resolveInitialVariantValues } from "utilities/variantPipeline";

/**
 * Exports GUI data.
 * @async
 * @param layer - The Figma layer to export GUI data from.
 * @returns The GUI data.
 */
export async function exportGUIData({ layer, parameters: { asTemplate, textAsSprites, collapseEmpty } }: GUIExportPipelineData, resources?: PipelineResources): Promise<GUIData> {
  const { name } = layer;
  asTemplate = asTemplate || false;
  textAsSprites = textAsSprites || false
  collapseEmpty = collapseEmpty || false;
  const rootData = resolveGUINodePluginData(layer);
  const exportOptions = resolveGUIExportOptions(layer, asTemplate, textAsSprites, collapseEmpty);
  const gui = convertGUIData(rootData);
  const filePath = resolveGUIFilePath(rootData);
  const nodes = await generateGUINodeData(exportOptions);
  const data: GUIData = { name, gui, nodes, filePath, asTemplate  };
  if (resources) {
    const { textures, fonts, layers } = resources;
    if (textures) {
      data.textures = textures;
    }
    if (fonts) {
      data.fonts = fonts;
    }
    if (layers) {
      data.layers = layers;
    }
  }
  return data;
}

/**
 * Resolves GUI export options.
 * @param layer - The Figma layer to resolve GUI node export options from
 * @returns The resolved GUI node export options.
 */
function resolveGUIExportOptions(layer: ExportableLayer, asTemplate: boolean, textAsSprites: boolean, collapseEmpty: boolean): GUINodeDataExportOptions {
  return {
    layer,
    atRoot: true,
    asTemplate,
    textAsSprites,
    collapseEmpty,
    namePrefix: "",
    parentId: "",
    parentPivot: config.guiNodeDefaultValues.pivot,
    parentSize: vector4(0),
    parentShift: vector4(-layer.x, -layer.y, 0, 0),
    clones: []
  }
}

/**
 * Generates GUI node data.
 * @param options - The GUI node data export options.
 */
async function generateGUINodeData(options: GUINodeDataExportOptions) {
  const { layer, textAsSprites } = options;
  if (canProcessGUIBoxNode(layer)) {
    return await generateGUIBoxNodeData({ layer, options });
  } else if (canProcessGUITextNode(layer)) {
    if (textAsSprites) {
      return await generateGUITextSpriteNodeData(layer, options);
    }
    return await generateGUITextNodeData(layer, options);
  }
  return [];
}

/**
 * Determines whether the Figma layer can be processed as a GUI box node.
 * @param layer - The Figma layer to check.
 * @returns True if the layer can be processed as a GUI box node, otherwise false.
 */
function canProcessGUIBoxNode(layer: ExportableLayer): layer is BoxLayer {
  return (isVisible(layer) || isSlice9Layer(layer)) && isFigmaBox(layer) && !isSlice9ServiceLayer(layer);
}

/**
 * Generates box GUI node data.
 * @param layer - The Figma layer to generate box GUI node data for.
 * @param options - The GUI node data export options.
 */
async function generateGUIBoxNodeData(data: GUIVariantPipelineData) {
  const { layer, options } = data;
  await tryInferGUINode(layer);
  const guiNodesData: GUINodeData[] = [];
  const guiNodeData = await convertBoxGUINodeData(layer, options);
  if (!guiNodeData.exclude) {
    const alreadyCloned = await isClonedLayer(layer, guiNodeData, options);
    if (!alreadyCloned) {
      if (guiNodeData.cloneable && isFigmaComponentInstance(layer)) {
        const cloneData = await createGUINodeCloneData(layer);
        if (cloneData) {
          options.clones.push(cloneData);
        }
      }
      const shouldSkip = shouldSkipEmpty(layer, guiNodeData, options) || await isLayerSkippable(layer, guiNodeData);
      if (!shouldSkip) {
        guiNodesData.push(guiNodeData);
      }
      if (await canProcessGUIBoxNodeChildren(layer, guiNodeData, options)) {
        const childrenData = await processGUIBoxNodeChildren(layer, guiNodeData, options, shouldSkip);
        if (shouldSkip) {
          guiNodesData.push(...childrenData);
        } else {
          if (!guiNodeData.children) {
            guiNodeData.children = [];
          }
          guiNodeData.children.push(...childrenData);
        }
      }
      if (canProcessGUIBoxNodeVariants(layer, guiNodeData, options)) {
        const variantData = await processGUIBoxNodeVariants(layer, guiNodeData, options, shouldSkip);
        if (shouldSkip) {
          guiNodesData.push(...variantData);
        } else {
          if (!guiNodeData.children) {
            guiNodeData.children = [];
          }
          guiNodeData.children.push(...variantData);
        }
      }
    }
  }
  return guiNodesData;
}

/**
 * Determines whether the Figma layer can be processed as a GUI text node.
 * @param layer - The Figma layer to check.
 * @returns True if the layer can be processed as a GUI text node, otherwise false.
 */
function canProcessGUITextNode(layer: ExportableLayer): layer is TextNode {
  return isVisible(layer) && isFigmaText(layer);
}

/**
 * Generates text GUI node data.
 * @param layer - The Figma layer to generate GUI node data for.
 * @param options - The GUI node data export options.
 */
async function generateGUITextNodeData(layer: TextNode, options: GUINodeDataExportOptions) {
  await tryInferGUINode(layer);
  const guiNodesData: GUINodeData[] = [];
  const guiNodeData = convertTextGUINodeData(layer, options);
  if (!guiNodeData.exclude) {
    const shouldSkip = await isLayerSkippable(layer, guiNodeData);
    if (!shouldSkip) {
      guiNodesData.push(guiNodeData);
    }
  }
  return guiNodesData;
}

async function generateGUITextSpriteNodeData(layer: TextNode, options: GUINodeDataExportOptions) {
  await tryInferGUINode(layer);
  const guiNodesData: GUINodeData[] = [];
  const guiNodeData = await convertTextSpriteGUINodeData(layer, options);
  if (!guiNodeData.exclude) {
    const shouldSkip = await isLayerSkippable(layer, guiNodeData);
    if (!shouldSkip) {
      guiNodesData.push(guiNodeData);
    }
  }
  return guiNodesData;
}

/**
 * Attempts to infer GUI node data.
 * @param layer - The Figma layer to try to infer GUI node data for.
 */
async function tryInferGUINode(layer: ExportableLayer) {
  if (isLayerData(layer)) {
    const pluginData = getPluginData(layer, "defoldGUINode");
    if (!pluginData?.inferred) {
      if (isFigmaBox(layer)) {
        await inferGUIBox(layer);
      } else if (isFigmaText(layer)) {
        inferGUIText(layer);
      }
    }
  }
}

/**
 * Determines whether a layer is an already cloned layer.
 * @param layer - The Figma layer to check.
 * @param guiNodeData - The GUI node data of the layer.
 * @param options - The GUI node data export options.
 * @returns True if the layer is an already cloned layer, otherwise false.
 */
async function isClonedLayer(layer: BoxLayer, guiNodeData: GUINodeData, options: GUINodeDataExportOptions) {
  if (guiNodeData.cloneable && isFigmaComponentInstance(layer)) {
    const mainComponent = await findMainFigmaComponent(layer);
    if (mainComponent) {
      if (options.clones?.find((clone) => isGUINodeClone(clone, mainComponent, layer))) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Determines whether a GUI node is a clone of a main Figma component.
 * @param data - The GUI node export clone data.
 * @param mainComponent - The main Figma component.
 * @param layer - The Figma layer to check.
 * @returns True if a matching clone is found, otherwise false.
 */
function isGUINodeClone(data: GUINodeExportCloneData, mainComponent: ComponentNode, layer: InstanceNode) {
  return (
    data.cloneOf === mainComponent &&
    areEqualComponentPropertySets(data.cloneInstance.componentProperties, layer.componentProperties) &&
    equalExposedComponentProperties(data.cloneInstance.exposedInstances, layer.exposedInstances)
  );
}

/**
 * Creates GUI node clone data.
 * @param clone - The Figma layer to create data for.
 * @returns The GUI node clone data.
 */
async function createGUINodeCloneData(clone: InstanceNode) {
  const mainComponent = await findMainFigmaComponent(clone);
  if (mainComponent) {
    return {
      cloneOf: mainComponent,
      cloneInstance: clone,
    }
  }
}

/**
 * Generates parent GUI node data export options.
 * @param  layer - The Figma layer to generate GUI node data export options for.
 * @param  shouldSkip - Whether the layer should be skipped.
 * @param  atRoot - Whether the layer is at the root level.
 * @param  parentOptions - The parent GUI node data export options.
 * @param  parentGUINodeData - The parent GUI node data.
 * @returns The generated parent GUI node data export options.
 */
async function generateParentOptions(layer: ExportableLayer, shouldSkip: boolean, atRoot: boolean, parentOptions: GUINodeDataExportOptions, parentGUINodeData: GUINodeData): Promise<GUINodeDataExportOptions> {
  const namePrefix = resolveGUINodeNamePrefix(shouldSkip, parentOptions);
  const forcedName = await resolveGUINodeForcedName(layer, parentOptions, parentGUINodeData);
  const parentParameters = resolveGUINodeLayerOptions(shouldSkip, parentOptions, parentGUINodeData);
  const { asTemplate, textAsSprites, collapseEmpty, variantPrefix, clones } = parentOptions;
  return {
    layer,
    atRoot,
    asTemplate,
    textAsSprites,
    collapseEmpty,
    namePrefix,
    variantPrefix,
    forcedName,
    clones,
    ...parentParameters,
  }
}

/**
 * Resolves GUI node layer export options.
 * @param shouldSkip - Whether the layer should be skipped.
 * @param parentOptions - The parent GUI node data export options.
 * @param guiNodeData - The GUI node data.
 * @returns The resolved GUI node layer export options.
 */
function resolveGUINodeLayerOptions(shouldSkip: boolean, parentOptions: GUINodeDataExportOptions, guiNodeData: GUINodeData): Pick<GUINodeDataExportOptions, "parentId" | "parentPivot" | "parentSize" | "parentShift"> {
  if (shouldSkip) {
    const { parentId, parentSize, parentPivot, parentShift } = parentOptions;
    return {
      parentId: parentId,
      parentSize: isZeroVector(parentSize) ? guiNodeData.size : parentSize,
      parentPivot: parentPivot,
      parentShift: addVectors(parentShift, guiNodeData.figma_position),
    }
  }
  return {
    parentId: guiNodeData.id,
    parentSize: guiNodeData.size,
    parentPivot: guiNodeData.pivot,
    parentShift: vector4(0),
  }
}

function shouldSkipEmpty(layer: BoxLayer, guiNodeData: GUINodeData, { collapseEmpty, atRoot }: GUINodeDataExportOptions) {
  if (!atRoot && collapseEmpty) {
    return !guiNodeData.texture && (!layer.children || layer.children.length <= 1);
  }
  return false;
}

/**
 * Determines whether children of the Figma layer can be processed as GUI nodes.
 * @param layer - The Figma layer to check.
 * @returns True if the children of the layer can be processed as GUI nodes, otherwise false.
 */
async function canProcessGUIBoxNodeChildren(layer: BoxLayer, guiNodeData: GUINodeData, options: GUINodeDataExportOptions) {
  return hasChildren(layer) && (!guiNodeData.template || (options.atRoot && options.asTemplate)) && !await isLayerSprite(layer)
}

/**
 * Processes the children of the Figma layer as GUI nodes.
 * @param layer - The Figma layer to process children for.
 * @param guiNodeData - The GUI node data.
 * @param options - The GUI node data export options.
 * @param shouldSkip - Whether the layer should be skipped.
 * @returns The GUI node data of the children.
 */
async function processGUIBoxNodeChildren(layer: BoxLayer, guiNodeData: GUINodeData, options: GUINodeDataExportOptions, shouldSkip: boolean) {
  const guiNodeChildrenData: GUINodeData[] = [];
  const { children } = layer;
  for (const child of children) {
    if (canProcessChildLayer(child)) {
      const parentOptions = await generateParentOptions(child, shouldSkip, shouldSkip && options.atRoot, options, guiNodeData);
      const guiNodeChild = await generateGUINodeData(parentOptions);
      guiNodeChildrenData.push(...guiNodeChild);
    }
  }
  return guiNodeChildrenData;
}


function canProcessGUIBoxNodeVariants(layer: BoxLayer, guiNodeData: GUINodeData, options: GUINodeDataExportOptions): layer is InstanceNode {
  return !options.variantPrefix && !!guiNodeData.export_variants && isFigmaComponentInstance(layer);
}

async function processGUIBoxNodeVariants(layer: InstanceNode, guiNodeData: GUINodeData, options: GUINodeDataExportOptions, shouldSkip: boolean) {
  const variants = extractExportVariants(layer);
  const results = [];
  if (variants) {
    const initialVariant = resolveInitialVariantValues(layer, variants);
    const variantPairs = Object.entries(variants);
    for (const [variantName, variantValues] of variantPairs) {
      for (const variantValue of variantValues) {
        layer.setProperties({ [variantName]: variantValue });
        await delay(100);
        await tryInferGUINode(layer);
        options.variantPrefix = variantValue;
        const result = await processGUIBoxNodeChildren(layer, guiNodeData, options, shouldSkip);
        results.push(...result);
        layer.setProperties({ [variantName]: initialVariant[variantName] });
        options.variantPrefix = "";
      }
    }
  }
  return results;
}

/**
 * Extracts atlas data from the GUI.
 * @param data - The GUI export pipeline data.
 * @param resources - The resources bundled with the GUI.
 * @returns The extracted atlas data.
 */
export async function extractGUIAtlasData(data: GUIExportPipelineData, resources?: PipelineResources): Promise<AtlasLayer[]> {
  if (resources && resources.textures) {
    const { textures } = resources;
    const atlases = reduceAtlasIdsFromResources(textures);
    const atlasLayers = await findAtlases(atlases);
    return atlasLayers;
  }
  return [];
}

export async function exportGUISpineData(guiData: GUIData): Promise<SpineData> {
  const { nodes } = guiData;
  const name = guiData.name;
  const filePath = resolveSpineFilePath();
  const skeleton = resolveSpineSkeletonData(guiData);
  const bones = generateSpineBoneData(nodes);
  const skins = generateSpineSkinData(nodes);
  const slots = generateSpineSlotData(nodes);
  const data: SpineData = { name, skeleton, bones, slots, skins, filePath };
  return data;
}

/**
 * Exports bundled GUI resources.
 * @param layer - The Figma layer to export bundled GUI resources from.
 * @returns The exported bundled GUI resources.
 */
export async function exportGUIResources({ layer, parameters: { textAsSprites } }: GUIExportPipelineData): Promise<PipelineResources> {
  textAsSprites = textAsSprites || false;
  const textures = await extractTextureData({ layer, skipVariants: false, textAsSprites });
  const fonts = await extractFontData({ layer, skipVariants: false });
  const layers = extractLayerData(layer);
  return {
    textures,
    fonts,
    layers
  };
}

/**
 * Packs the GUI with parameters for export.
 * @param layers - The GUI layers to pack.
 * @returns The packed GUI.
 */
export function packGUI(layers: ExportableLayer[], textAsSprites: boolean = false, collapseEmpty: boolean = false) {
  const rootGUI = processRootGUI(layers, textAsSprites, collapseEmpty);
  const childGUITemplates = processChildGUITemplates(layers, textAsSprites, collapseEmpty);
  return [ ...rootGUI, ...childGUITemplates ];
}

/**
 * Detects if a root GUI node is a template node
 * @param nodes - The list of GUI nodes to check.
 * @returns The list of root nodes.
 */
function processRootGUI(layers: ExportableLayer[], textAsSprites: boolean, collapseEmpty: boolean): GUIExportPipelineData[] {
  return layers.map((layer) => processRootGUINode(layer, textAsSprites, collapseEmpty));
}

/**
 * Processes child GUI templates.
 * @param layer - The Figma layer to process child GUI templates for.
 * @returns The processed child GUI templates.
 */
export function processChildGUITemplates(layers: readonly SceneNode[], textAsSprites: boolean, collapseEmpty: boolean): GUIExportPipelineData[] {
  const templateNodes: GUIExportPipelineData[] = [];
  for (const layer of layers) {
    if (isVisible(layer) && isFigmaBox(layer)) {
      const data = getPluginData(layer, "defoldGUINode");
      if (!data?.exclude) {
        if (isGUITemplate(layer)) {
          const parameters = { textAsSprites, collapseEmpty, asTemplate: true };
          const input = { layer, parameters };
          templateNodes.push(input);
        } else {
          const { children } = layer;
          const childTemplateNodes = processChildGUITemplates(children, textAsSprites, collapseEmpty);
          templateNodes.push(...childTemplateNodes);
        }
      }
    }
  }
  return templateNodes;
}

/**
 * Packs the GUI node with parameters for export.
 * @param layer - The GUI layer to pack.
 * @returns The packed GUI node.
 */
export function packGUINode(layer: ExportableLayer, textAsSprites: boolean = false, collapseEmpty: boolean = false) {
  const rootGUI = processRootGUINode(layer, textAsSprites, collapseEmpty);
  return rootGUI;
}

/**
 * Processes the root GUI node.
 * @param layer - The Figma layer to process.
 * @returns The processed GUI node.
 */
function processRootGUINode(layer: ExportableLayer, textAsSprites: boolean, collapseEmpty: boolean): GUIExportPipelineData {
  const asTemplate = !isFigmaSlice(layer) && isGUITemplate(layer);
  const parameters = { textAsSprites, collapseEmpty, asTemplate };
  return { layer, parameters };
}
