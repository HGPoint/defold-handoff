/**
 * Handles game-related data export.
 * @packageDocumentation
 */

import { findAtlases, reduceAtlasIdsFromResources } from "utilities/atlas";
import { canProcessChildLayer, isLayerSkippable } from "utilities/data";
import { hasChildren, isFigmaBox, isFigmaSlice, isFigmaText, isLayerSprite, isVisible } from "utilities/figma";
import { resolveDepthAxisParameters, resolveGameCollectionFilePath, resolveGameComponentTypeId, resolveGameObjectForcedName, resolveGameObjectNamePrefix, resolveGameObjectPluginData } from "utilities/gameCollection";
import { convertEmptyComponentData, convertGameCollectionData, convertLabelComponentData, convertSpriteComponentData } from "utilities/gameCollectionConversion";
import { inferGameCollectionParentTransformations } from "utilities/inference";
import { addVectors, copyVector, isZeroVector, vector4 } from "utilities/math";
import { isSlice9ServiceLayer, isUsedSlice9Layer } from "utilities/slice9";
import { extractTextureData } from "utilities/texture";

/**
 * Exports game collection data.
 * @param layer - The Figma layer to export game collection data from.
 * @param resources - The resources bundled with the collection.
 * @returns The game collection data.
 */
export async function exportGameCollectionData(layer: ExportableLayer, resources?: PipelineResources): Promise<GameCollectionData> {
  const { name } = layer;
  const rootData = resolveGameObjectPluginData(layer);
  const exportOptions = resolveGameCollectionExportOptions(layer, rootData);
  const collection = convertGameCollectionData(rootData);
  const filePath = resolveGameCollectionFilePath(rootData);
  const gameObjects = await generateGameObjectData(exportOptions);
  const data: GameCollectionData = {
    name,
    collection,
    gameObjects,
    filePath,
  };
  if (resources && resources.textures) {
    const { textures } = resources;
    data.textures = textures;
  }
  return data;
}

/**
 * Resolves game collection export options.
 * @param layer - The Figma layer to resolve game collection export options from.
 * @param data - The plugin data to resolve game collection export options from.
 * @returns The resolved game collection export options.
 */
function resolveGameCollectionExportOptions(layer: ExportableLayer, data?: WithNull<PluginGameObjectData>): GameObjectDataExportOptions {
  const parentTransformations = inferGameCollectionParentTransformations(layer);
  const depthAxisParameters = resolveDepthAxisParameters(data);
  return {
    layer,
    atRoot: true,
    namePrefix: "",
    parentId: "",
    ...parentTransformations,
    ...depthAxisParameters,
  }
}

/**
 * Generates game object data.
 * @param options - The game object data export options.
 * @returns 
 */
async function generateGameObjectData(options: GameObjectDataExportOptions) {
  const { layer } = options;
  if (await canProcessSpriteComponent(layer)) {
    return await generateSpriteComponentData(layer, options)
  } else if (canProcessLabelComponent(layer)) {
    return await generateLabelComponentData(layer, options)
  } else if (canProcessEmptyComponent(layer)) {
    return await generateEmptyComponentData(layer, options);
  }
  return [];
}

/**
 * Determines whether the Figma layer can be processed as a sprite game object.
 * @param layer - The Figma layer to check.
 * @returns True if the layer can be processed as a sprite game object, otherwise false.
 */
async function canProcessSpriteComponent(layer: ExportableLayer) {
  return (isVisible(layer) && isFigmaSlice(layer)) || ((isVisible(layer) || isUsedSlice9Layer(layer)) && !isSlice9ServiceLayer(layer) && await isLayerSprite(layer))
}

/**
 * Generates sprite game object data.
 * @param layer - The Figma layer to generate sprite game object data from.
 * @param options - The game object data export options.
 * @returns The generated sprite game object data.
 */
async function generateSpriteComponentData(layer: ExportableLayer, options: GameObjectDataExportOptions) {
  const gameObjectsData: GameObjectData[] = [];
  if (isFigmaBox(layer) || isFigmaSlice(layer)) {
    const componentData = await convertSpriteComponentData(layer, options);
    if (!componentData.exclude) {
      const shouldSkip = await isLayerSkippable(layer, componentData);
      if (!shouldSkip) {
        if (componentData.implied_game_object) {
          const impliedGameObject = wrapInImpliedGameObject(componentData);
          gameObjectsData.push(impliedGameObject);
        } else {
          gameObjectsData.push(componentData);
        }
      }
    }
  }
  return gameObjectsData;
}

/**
 * Determines whether the Figma layer can be processed as a label game object.
 * @param layer - The Figma layer to process.
 */
function canProcessLabelComponent(layer: ExportableLayer): layer is TextNode {
  return isVisible(layer) && isFigmaText(layer);
}

/**
 * Generates label game object data.
 * @param layer - The layer to generate label game object data from.
 * @param options - The game object data export options.
 * @returns The generated label game object data.
 */
async function generateLabelComponentData(layer: TextNode, options: GameObjectDataExportOptions) {
  const componentData = await convertLabelComponentData(layer, options);
  const gameObjectsData: GameObjectData[] = [];
  if (!componentData.exclude) {
    const shouldSkip = await isLayerSkippable(layer, componentData);
    if (!shouldSkip) {
      if (componentData.implied_game_object) {
        const impliedGameObject = wrapInImpliedGameObject(componentData);
        gameObjectsData.push(impliedGameObject);
      } else {
        gameObjectsData.push(componentData);
      }
    }
  }
  return gameObjectsData;
}

/**
 * Determines whether the Figma layer can be processed as a base game object.
 * @param layer - The Figma layer to process.
 */
function canProcessEmptyComponent(layer: ExportableLayer): layer is BoxLayer {
  return isVisible(layer) && isFigmaBox(layer);
}

/**
 * Generates base game object data.
 * @param layer - The Figma layer to generate base game object data from.
 * @param options - The game object data export options.
 * @returns The generated base game object data.
 */
async function generateEmptyComponentData(layer: BoxLayer, options: GameObjectDataExportOptions) {
  const componentData = await convertEmptyComponentData(layer, options);
  const gameObjectsData: GameObjectData[] = [];
  if (!componentData.exclude) {
    const shouldSkip = await isLayerSkippable(layer, componentData);
    if (!shouldSkip) {
      gameObjectsData.push(componentData);
    }
    if (await canProcessComponentChildren(layer)) {
      const childrenData = await processComponentChildren(layer, componentData, options, shouldSkip);
      if (shouldSkip) {
        gameObjectsData.push(...childrenData);
      } else {
        componentData.components = childrenData;
      }
    }
  }
  return gameObjectsData;
}

/**
 * Determines whether children of the Figma layer can be processed as game objects.
 * @param layer - The Figma layer to check.
 * @returns True if the children of the layer can be processed as game objects, otherwise false.
 */
async function canProcessComponentChildren(layer: BoxLayer) {
  return hasChildren(layer) && !await isLayerSprite(layer)
}

/**
 * Processes the children of the Figma layer as game objects.
 * @param layer - The Figma layer to process children as game objects.
 * @param gameObjectData - The game object data.
 * @param options - The game object data export options.
 * @param shouldSkip - Whether the parent game object should be skipped.
 * @returns The processed game object data of the children.
 */
async function processComponentChildren(layer: BoxLayer, gameObjectData: GameObjectData, options: GameObjectDataExportOptions, shouldSkip: boolean) {
  const gameObjectChildrenData: GameObjectData[] = [];
  const { children } = layer;
  for (const child of children) {
    if (canProcessChildLayer(child)) {
      const parentOptions = await generateParentOptions(child, shouldSkip, shouldSkip && options.atRoot, options, gameObjectData);
      const gameObjectChild = await generateGameObjectData(parentOptions);
      gameObjectChildrenData.push(...gameObjectChild);
    }
  }
  return gameObjectChildrenData;
}

/**
 * Generates parent game object data export options.
 * @param layer - The Figma layer to generate parent game object data export options from.
 * @param shouldSkip - Whether the layer should be skipped.
 * @param atRoot - Whether the layer is at the root level.
 * @param parentOptions - The parent game object data export options.
 * @param parentGameObjectData - The parent game object data.
 * @returns The generated parent game object data export options.
 */
async function generateParentOptions(layer: ExportableLayer, shouldSkip: boolean, atRoot: boolean, parentOptions: GameObjectDataExportOptions, parentGameObjectData: GameObjectData): Promise<GameObjectDataExportOptions> {
  const namePrefix = resolveGameObjectNamePrefix(shouldSkip, parentOptions);
  const forcedName = await resolveGameObjectForcedName(layer, parentOptions, parentGameObjectData);
  const depthAxisParameters = resolveDepthAxisParameters(parentGameObjectData);
  const layerOptions = resolveGameObjectLayerOptions(shouldSkip, parentOptions, parentGameObjectData);
  return {
    layer,
    atRoot,
    namePrefix,
    forcedName,
    ...depthAxisParameters,
    ...layerOptions,
  }
}

/**
 * Resolves game object layer export options.
 * @param shouldSkip - Whether the game object should be skipped.
 * @param parentOptions - The parent game object data export options.
 * @param gameObjectData - The game object data.
 * @returns The resolved game object layer export options.
 */
function resolveGameObjectLayerOptions(shouldSkip: boolean, parentOptions: GameObjectDataExportOptions, gameObjectData: GameObjectData): Pick<GameObjectDataExportOptions, "parentId" | "parentSize" | "parentShift"> {
  const { layer, atRoot } = parentOptions;
  const fallbackParentSize = vector4(layer.width, layer.height, 0, 0)
  if (shouldSkip) {
    const { parentId, parentSize, parentShift } = parentOptions;
    const resolvedParentSize = isZeroVector(parentSize) ? fallbackParentSize : parentSize;
    const resolvedFigmaPosition = gameObjectData.figma_position || vector4(0);
    const resolvedParentShift = atRoot ? vector4(0) : addVectors(parentShift, resolvedFigmaPosition)
    return {
      parentId: parentId,
      parentSize: resolvedParentSize,
      parentShift: resolvedParentShift,
    }
  }
  return {
    parentId: gameObjectData.id,
    parentSize: fallbackParentSize,
    parentShift: vector4(0),
  }
}

/**
 * Reorganizes the game object data to include implied game objects.
 * @param componentData - The game object data to reorganize.
 * @returns The reorganized game object data.
 */
function wrapInImpliedGameObject(componentData: GameObjectData): GameObjectData {
  const { id, position, skip, path, exclude, exportable_layer, exportable_layer_name, exportable_layer_id, figma_position, figma_children } = componentData;
  const typeId = resolveGameComponentTypeId(componentData.type);
  componentData.id = `${id}_${typeId}`;
  componentData.position = vector4(0);
  return {
    id,
    type: "TYPE_EMPTY",
    position: copyVector(position),
    rotation: vector4(0),
    scale: vector4(1),
    skip,
    implied_game_object: false,
    arrange_depth: false,
    inferred: true,
    exclude,
    path,
    exportable_layer,
    exportable_layer_name,
    exportable_layer_id,
    figma_position,
    figma_children,
    components: [componentData]
  }
}

/**
 * Extracts atlas data from the game collection.
 * @param data - The game collection data to extract atlas data from.
 * @param resources - The resources bundled with the collection.
 * @returns The extracted atlas data.
 */
export async function extractGameCollectionAtlasData(data: ExportableLayer, resources?: PipelineResources): Promise<AtlasLayer[]> {
  if (resources && resources.textures) {
    const { textures } = resources;
    const atlases = reduceAtlasIdsFromResources(textures);
    const atlasLayers = await findAtlases(atlases);
    return atlasLayers;
  }
  return [];
}

/**
 * Exports bundled game collection resources.
 * @param layer - The Figma layer to export bundled game collection resources from.
 * @returns The exported bundled game collection resources.
 */
export async function exportGameCollectionResources(layer: ExportableLayer): Promise<PipelineResources> {
  const parameters = { layer, skipVariants: false, textAsSprites: false }
  const textures = await extractTextureData(parameters);
  return { textures };
}
