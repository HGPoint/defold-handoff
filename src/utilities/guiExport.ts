/**
 * Handles GUI-related data export.
 * @packageDocumentation
 */

import config from "config/config.json";
import { findAtlases, reduceAtlasIdsFromResources } from "utilities/atlas";
import { canProcessChildLayer, isLayerSkippable } from "utilities/data";
import delay from "utilities/delay";
import { areEqualComponentPropertySets, equalExposedComponentProperties, findMainFigmaComponent, getPluginData, hasChildren, isFigmaBox, isFigmaComponentInstance, isFigmaRectangle, isFigmaSlice, isFigmaText, isLayerData, isLayerSprite, isVisible } from "utilities/figma";
import { extractFontData } from "utilities/font";
import { isGUITemplate, resolveGUIFilePath, resolveGUINodeForcedName, resolveGUINodeNamePrefix, resolveGUINodePluginData } from "utilities/gui";
import { convertBoxGUINodeData, convertGUIData, convertImpliedBoxGUINodeData, convertTextGUINodeData, convertTextSpriteGUINodeData } from "utilities/guiConversion";
import { inferGUIBox, inferGUIText } from "utilities/inference";
import { extractLayerData } from "utilities/layer";
import { addVectors, isZeroVector, vector4 } from "utilities/math";
import { resolvePSDFilePath, resolvePSDFileSize } from "utilities/psd";
import { generatePSDLayerData } from "utilities/psdExport";
import { isSlice9ServiceLayer, isUsedSlice9Layer } from "utilities/slice9";
import { resolveSpineFilePath, resolveSpineSkeletonData } from "utilities/spine";
import { generateSpineBoneData, generateSpineSkinData, generateSpineSlotData } from "utilities/spineExport";
import { extractSpineData } from "utilities/spineResource";
import { extractTextureData } from "utilities/texture";
import { extractExportVariants, resolveInitialVariantValues } from "utilities/variantPipeline";

export const DEFAULT_PACK_OPTIONS: GUIPackOptions = {
  textAsSprites: false,
  collapseTemplates: false,
  collapseEmpty: false,
}

/**
 * Exports GUI data.
 * @async
 * @param layer - The Figma layer to export GUI data from.
 * @returns The GUI data.
 */
export async function exportGUIData({ layer, parameters }: GUIExportPipelineData, resources?: PipelineResources): Promise<GUIData> {
  const { name } = layer;
  const { asTemplate } = parameters;
  const rootData = resolveGUINodePluginData(layer);
  const size = resolveGUISize(layer);
  const exportOptions = resolveGUIExportOptions(layer, parameters);
  const gui = convertGUIData(rootData);
  const filePath = resolveGUIFilePath(rootData);
  const nodes = await generateGUINodeData(exportOptions);
  const data: GUIData = {
    name,
    gui,
    nodes,
    filePath,
    asTemplate,
    size,
  };
  if (resources) {
    const { textures, fonts, layers, spines } = resources;
    if (textures) {
      data.textures = textures;
    }
    if (fonts) {
      data.fonts = fonts;
    }
    if (layers) {
      data.layers = layers;
    }
    if (spines) {
      data.spines = spines;
    }
  }
  return data;
}

function resolveGUISize(layer: ExportableLayer) {
  const { width: x, height: y } = layer;
  return vector4(x, y, 0, 0);
}

/**
 * Resolves GUI export options.
 * @param layer - The Figma layer to resolve GUI node export options from
 * @returns The resolved GUI node export options.
 */
function resolveGUIExportOptions(layer: ExportableLayer, parameters: GUINodeExportParameters): GUINodeDataExportOptions {
  const options: GUINodeDataExportOptions = {
    ...parameters,
    layer,
    atRoot: true,
    namePrefix: "",
    parentId: "",
    parentPivot: config.guiNodeDefaultValues.pivot,
    parentSize: vector4(0),
    parentShift: vector4(-layer.x, -layer.y, 0, 0),
    clones: []
  }
  return options;
}

/**
 * Generates GUI node data.
 * @param options - The GUI node data export options.
 */
async function generateGUINodeData(options: GUINodeDataExportOptions) {
  const { layer, textAsSprites } = options;
  if (canProcessGUIBoxNode(layer)) {
    return await generateGUIBoxNodeData({ layer, options });
  } else if (canProcessGUIImpliedBoxNode(layer)) {
    return generateGUIImpliedBoxNodeData(layer, options);
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
function canProcessGUIBoxNode(layer: SceneNode): layer is BoxLayer {
  return (isVisible(layer) || isUsedSlice9Layer(layer)) && isFigmaBox(layer) && !isSlice9ServiceLayer(layer);
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
  if (!guiNodeData.exclude || options.collapseTemplates) {
    const alreadyCloned = await isClonedLayer(layer, guiNodeData, options);
    if (!alreadyCloned || options.collapseTemplates) {
      if (guiNodeData.cloneable &&  !options.collapseTemplates && isFigmaComponentInstance(layer)) {
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

function canProcessGUIImpliedBoxNode(layer: SceneNode) {
  return isFigmaRectangle(layer);
}

function generateGUIImpliedBoxNodeData(layer: RectangleNode, options: GUINodeDataExportOptions) {
  const guiNodesData: GUINodeData[] = [];
  if (isVisible(layer)) {
    const guiNodeData = convertImpliedBoxGUINodeData(layer, options);
    guiNodesData.push(guiNodeData);
  }
  return guiNodesData;
}

/**
 * Determines whether the Figma layer can be processed as a GUI text node.
 * @param layer - The Figma layer to check.
 * @returns True if the layer can be processed as a GUI text node, otherwise false.
 */
function canProcessGUITextNode(layer: SceneNode): layer is TextNode {
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
  const { asTemplate, textAsSprites, collapseEmpty, collapseTemplates, variantPrefix, clones } = parentOptions;
  return {
    layer,
    atRoot,
    asTemplate,
    textAsSprites,
    collapseEmpty,
    collapseTemplates,
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
    const resolvedParentSize = isZeroVector(parentSize) ? guiNodeData.size : parentSize;
    const resolvedFigmaPosition = guiNodeData.figma_position || vector4(0);
    const resolvedParentShift = addVectors(parentShift, resolvedFigmaPosition)
    return {
      parentId,
      parentSize: resolvedParentSize,
      parentPivot,
      parentShift: resolvedParentShift,
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
  return hasChildren(layer) && (options.collapseTemplates || !guiNodeData.template || (options.atRoot && options.asTemplate)) && !(await isLayerSprite(layer))
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
  return !options.collapseTemplates && !options.variantPrefix && !!guiNodeData.export_variants && isFigmaComponentInstance(layer);
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
  const { name, nodes } = guiData;
  const filePath = resolveSpineFilePath();
  const skeleton = resolveSpineSkeletonData(guiData);
  const bones = generateSpineBoneData(nodes);
  const skins = generateSpineSkinData(nodes);
  const slots = generateSpineSlotData(nodes);
  const data: SpineData = { name, skeleton, bones, slots, skins, filePath };
  return data;
}

export async function exportGUIPSDData(guiData: GUIData): Promise<PSDData> {
  const { name, nodes } = guiData;
  const canvasSize = resolvePSDFileSize(guiData)
  const filePath = resolvePSDFilePath();
  const layers = generatePSDLayerData(nodes, canvasSize);
  const data: PSDData = {
    name,
    size: canvasSize,
    layers,
    filePath
  }
  return data;
}

/**
 * Exports bundled GUI resources.
 * @param layer - The Figma layer to export bundled GUI resources from.
 * @returns The exported bundled GUI resources.
 */
export async function exportGUIResources({ layer, parameters: { textAsSprites, collapseTemplates } }: GUIExportPipelineData): Promise<PipelineResources> {
  textAsSprites = textAsSprites || false;
  const skipVariants = collapseTemplates || false;
  const textures = await extractTextureData({ layer, skipVariants, textAsSprites });
  const fonts = await extractFontData({ layer, skipVariants });
  const spines = await extractSpineData({ layer, skipVariants });
  const layers = extractLayerData(layer);
  return {
    textures,
    fonts,
    layers,
    spines
  };
}

/**
 * Packs the GUI with parameters for export.
 * @param layers - The GUI layers to pack.
 * @returns The packed GUI.
 */
export function packGUI(layers: ExportableLayer[], packOptions: GUIPackOptions) {
  const { collapseTemplates } = packOptions;
  const rootGUI = processRootGUI(layers, packOptions);
  if (!collapseTemplates) {
    const childGUITemplates = processChildGUITemplates(layers, packOptions);
    return [ ...rootGUI, ...childGUITemplates ];
  }
  return rootGUI;
}

/**
 * Detects if a root GUI node is a template node
 * @param nodes - The list of GUI nodes to check.
 * @returns The list of root nodes.
 */
function processRootGUI(layers: ExportableLayer[], packOptions: GUIPackOptions): GUIExportPipelineData[] {
  return layers.map((layer) => processRootGUINode(layer, packOptions));
}

/**
 * Processes child GUI templates.
 * @param layer - The Figma layer to process child GUI templates for.
 * @returns The processed child GUI templates.
 */
export function processChildGUITemplates(layers: readonly SceneNode[], packOptions: GUIPackOptions): GUIExportPipelineData[] {
  const templateNodes: GUIExportPipelineData[] = [];
  for (const layer of layers) {
    if (isVisible(layer) && isFigmaBox(layer)) {
      const data = getPluginData(layer, "defoldGUINode");
      if (!data?.exclude) {
        if (isGUITemplate(layer)) {
          const parameters = { ...packOptions, asTemplate: true };
          const template = { layer, parameters };
          templateNodes.push(template);
        } else {
          const { children } = layer;
          const childTemplateNodes = processChildGUITemplates(children, packOptions);
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
export function packGUINode(layer: ExportableLayer, packOptions: GUIPackOptions) {
  const rootGUI = processRootGUINode(layer, packOptions);
  return rootGUI;
}

/**
 * Processes the root GUI node.
 * @param layer - The Figma layer to process.
 * @returns The processed GUI node.
 */
function processRootGUINode(layer: ExportableLayer, packOptions: GUIPackOptions): GUIExportPipelineData {
  const { collapseTemplates } = packOptions;
  const asTemplate = !collapseTemplates && !isFigmaSlice(layer) && isGUITemplate(layer);
  const parameters = { ...packOptions, asTemplate };
  return { layer, parameters };
}
