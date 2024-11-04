/**
 * Utility module for generating game object data.
 * @packageDocumentation
 */

import config from "config/config.json";
import { projectConfig } from "handoff/project";
import { vector4, isZeroVector, addVectors, copyVector} from "utilities/math";
import { isEmptyGameObjectType, isLabelGameObjectType, isSpriteGameObjectType } from "utilities/gameObject";
import { getPluginData, isAtlasSprite, isFigmaText, isFigmaBox, isFigmaSlice, isFigmaComponentInstance, isFigmaComponent, isExportable, isSpriteHolderLayer, hasChildren, isFigmaSceneNode } from "utilities/figma";
import { convertGameCollectionData, convertSpriteComponentData, convertLabelComponentData, convertEmptyComponentData } from "utilities/gameObjectDataConverters";
import { generateTexturesData } from "utilities/textureExtraction";
import { isSlice9PlaceholderLayer, isSlice9Layer, isSlice9ServiceLayer } from "utilities/slice9";
import { inferGameObject } from "utilities/inference";

const EMPTY_COMPONENT_PROPERTIES = [
  "type",
  "id",
  "children",
  "position",
  "rotation",
  "scale",
]

const SPRITE_COMPONENT_PROPERTIES = [
  "type",
  "id",
  "position",
  "rotation",
  "scale",
  "size",
  "size_mode",
  "image",
  "default_animation",
  "slice9",
  "material",
  "blend_mode",
];

const LABEL_COMPONENT_PROPERTIES = [
  "type",
  "id",
  "position",
  "rotation",
  "scale",
  "size",
  "text",
  "color",
  "outline",
  "shadow",
  "text_leading",
  "text_tracking",
  "pivot",
  "blend_mode",
];

function generateRootOptions(layer: ExportableLayer, data?: PluginGameObjectData | null): GameObjectDataExportOptions {
  const hasParent = layer.parent && isFigmaSceneNode(layer.parent);
  const parentSize = hasParent ? vector4(layer.parent.width, layer.parent.height, 0, 0) : vector4(0);
  const parentShift = hasParent ? vector4(-layer.parent.x, -layer.parent.y, 0, 0) : vector4(0);
  return {
    layer,
    atRoot: true,
    namePrefix: "",
    parentId: "",
    parentSize: parentSize,
    parentShift: parentShift,
    parentChildren: [],
    arrangeDepth: data?.arrange_depth || config.gameObjectDefaultSpecialValues.arrange_depth,
    depthAxis: data?.depth_axis || config.gameObjectDefaultSpecialValues.depth_axis,
  }
}

function resolveParentParameters(shouldSkip: boolean, parentOptions: GameObjectDataExportOptions, gameObjectData: GameObjectData): Pick<GameObjectDataExportOptions, "parentId" | "parentSize" | "parentShift" | "parentChildren" | "arrangeDepth" | "depthAxis"> {
  const { layer } = parentOptions;
  if (shouldSkip) {
    const { parentId, parentSize, parentShift, parentChildren } = parentOptions;
    return {
      parentId: parentId,
      parentSize: isZeroVector(parentSize) ? vector4(layer.width, layer.height, 0, 0) : parentSize,
      parentShift: addVectors(parentShift, gameObjectData.figma_position),
      parentChildren: parentChildren,
      arrangeDepth: gameObjectData?.arrange_depth || config.gameObjectDefaultSpecialValues.arrange_depth,
      depthAxis: gameObjectData?.depth_axis || config.gameObjectDefaultSpecialValues.depth_axis,
    }
  }
  return {
    parentId: gameObjectData.id,
    parentSize: vector4(layer.width, layer.height, 0, 0),
    parentShift: vector4(0),
    parentChildren: gameObjectData.components,
    arrangeDepth: gameObjectData?.arrange_depth || config.gameObjectDefaultSpecialValues.arrange_depth,
    depthAxis: gameObjectData?.depth_axis || config.gameObjectDefaultSpecialValues.depth_axis,
  }
}

function generateNamePrefix(shouldSkip: boolean, options: GameObjectDataExportOptions): string {
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

async function generateForcedName(layer: ExportableLayer, parentOptions: GameObjectDataExportOptions, parentGameObjectData: GameObjectData): Promise<string | undefined> {
  const { parent } = layer;
  if (parent) {
    if (parentGameObjectData.skip && parentOptions.forcedName && isSlice9PlaceholderLayer(parent)) {
      return parentOptions.forcedName;
    }
    if (isExportable(parent) && await isSpriteHolderLayer(parent)) {
      return parent.name
    }
  }
  return undefined;
}

async function generateParentOptions(layer: ExportableLayer, shouldSkip: boolean, atRoot: boolean, parentOptions: GameObjectDataExportOptions, parentGameObjectData: GameObjectData): Promise<GameObjectDataExportOptions> {
  const namePrefix = generateNamePrefix(shouldSkip, parentOptions);
  const forcedName = await generateForcedName(layer, parentOptions, parentGameObjectData);
  const parentParameters = resolveParentParameters(shouldSkip, parentOptions, parentGameObjectData);
  return {
    layer,
    atRoot,
    namePrefix,
    forcedName,
    ...parentParameters,
  }
}

function resolveTypeId(type?: GameObjectType) {
  if (!type) {
    return "empty";
  }
  return type.replace("TYPE_", "").toLowerCase();
}

function generateImpliedGameObject(componentData: GameObjectData): GameObjectData {
  const { id, position, skip, path, exclude, exportable_layer, exportable_layer_name, exportable_layer_id, figma_position } = componentData;
  const typeId = resolveTypeId(componentData.type); 
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
    components: [componentData]
  }
}

async function generateGameObjectData(options: GameObjectDataExportOptions, gameObjectsData: GameObjectData[]) {
  if (gameObjectsData) {
    const { layer } = options;
    if (await canProcessSpriteComponent(layer)) {
      await generateSpriteComponentData(layer, options, gameObjectsData)
    } else if (canProcessLabelComponent(layer)) {
      await generateLabelComponentData(layer, options, gameObjectsData)
    } else if (canProcessEmptyComponent(layer)) {
      await generateEmptyComponentData(layer, options, gameObjectsData);
    }
  }
}

async function canProcessSpriteComponent(layer: ExportableLayer) {
  return (layer.visible && isFigmaSlice(layer)) || ((layer.visible || isSlice9Layer(layer)) && !isSlice9ServiceLayer(layer) && await isAtlasSprite(layer))
}

async function generateSpriteComponentData(layer: ExportableLayer, options: GameObjectDataExportOptions, gameObjectsData: GameObjectData[]) {
  await tryInferComponent(layer);
  if (isFigmaBox(layer) || isFigmaSlice(layer)) {
    const componentData = await convertSpriteComponentData(layer, options);
    if (!componentData.exclude) {
      const shouldSkip = await isSkippableLayer(layer, componentData);
      if (!shouldSkip) {
        if (componentData.implied_game_object) {
          const impliedGameObject = generateImpliedGameObject(componentData);
          gameObjectsData.push(impliedGameObject);
        } else {
          gameObjectsData.push(componentData);
        }
      }
    }
  }
}

function canProcessLabelComponent(layer: ExportableLayer): layer is TextNode {
  return isFigmaText(layer) && layer.visible
}

async function generateLabelComponentData(layer: TextNode, options: GameObjectDataExportOptions, gameObjectsData: GameObjectData[]) {
  await tryInferComponent(layer);
  const componentData = await convertLabelComponentData(layer, options);
  if (!componentData.exclude) {
    const shouldSkip = await isSkippableLayer(layer, componentData);
    if (!shouldSkip) {
      if (componentData.implied_game_object) {
        const gameObject = generateImpliedGameObject(componentData);
        gameObjectsData.push(gameObject);
      } else {
        gameObjectsData.push(componentData);
      }
    }
  }
}

function canProcessEmptyComponent(layer: ExportableLayer): layer is FrameNode | ComponentNode | InstanceNode {
  return isFigmaBox(layer) && layer.visible
}

async function generateEmptyComponentData(layer: BoxLayer, options: GameObjectDataExportOptions, gameObjectsData: GameObjectData[]) {
  await tryInferComponent(layer);
  const componentData = await convertEmptyComponentData(layer, options);
  if (!componentData.exclude) {
    const shouldSkip = await isSkippableLayer(layer, componentData);
    if (!shouldSkip) {
      gameObjectsData.push(componentData);
    }
    if (await shouldProcessComponentChildren(layer)) {
      await processComponentChildren(layer, componentData, shouldSkip, options, gameObjectsData);
    }
  }
}

async function shouldProcessComponentChildren(layer: BoxLayer) {
  return hasChildren(layer) && !await isAtlasSprite(layer)
}

async function processComponentChildren(layer: BoxLayer, gameObjectData: GameObjectData, shouldSkip: boolean, options: GameObjectDataExportOptions, gameObjectsData: GameObjectData[]) {
  const gameObjectChildren = !shouldSkip ? [] : gameObjectsData;
  const { children } = layer;
  if (!shouldSkip) {
    gameObjectData.components = gameObjectChildren;
  }
  for (const child of children) {
    if (shouldProcessChildLayer(child)) {
      const parentOptions = await generateParentOptions(child, shouldSkip, shouldSkip && options.atRoot, options, gameObjectData);
      await generateGameObjectData(parentOptions, gameObjectChildren);
    }
  }
}

function shouldProcessChildLayer(layer: SceneNode): layer is ExportableLayer {
  return isExportable(layer) && !isSlice9ServiceLayer(layer);
}

async function isSkippableLayer(layer: ExportableLayer, gameObjectData: GameObjectData): Promise<boolean> {
  return ( 
    gameObjectData.skip ||
    layer.name.startsWith(projectConfig.autoskip) ||
    isSlice9PlaceholderLayer(layer) ||
    await isSpriteHolderLayer(layer)
  );
}

async function tryInferComponent(layer: ExportableLayer) {
  const pluginData = getPluginData(layer, "defoldGameObject");
  if (!pluginData?.inferred) {
    inferGameObject(layer);
  }
}

function processGameObjectsStructure(gameObjects: GameObjectData[]) {
  const processedNodes: GameObjectData[] = [];
  for (const gameObject of gameObjects) {
    if (isEmptyGameObjectType(gameObject.type)) {
      processedNodes.push(gameObject);
      if (gameObject.components && gameObject.components.length > 0) {
        processedNodes.push(...processGameObjectsStructure(gameObject.components));
      }
    }
  }
  return processedNodes;
}

function shouldRemoveProperty(key: keyof GameObjectData, value: GameObjectData[keyof GameObjectData], type?: GameObjectType) {
  if (key === "components") {
    return false;
  }
  if (isSpriteGameObjectType(type)) {
    return !SPRITE_COMPONENT_PROPERTIES.includes(key);
  }
  if (isLabelGameObjectType(type)) {
    return !LABEL_COMPONENT_PROPERTIES.includes(key);
  }
  if (isEmptyGameObjectType(type)) {
    return !EMPTY_COMPONENT_PROPERTIES.includes(key);
  }
  return true;
}

function processGameObjectsProperties(gameObject: GameObjectData) {
  const properties = Object.entries(gameObject) as [keyof GameObjectData, GameObjectData[keyof GameObjectData]][];
  for (const [ key, value ] of properties) {
    if (shouldRemoveProperty(key, value, gameObject.type)) {
      delete gameObject[key];
    }
    if (gameObject.components) {
      gameObject.components.forEach(processGameObjectsProperties);
    }
  }
}

function processGameObjectsCleanUp(gameObject: GameObjectData) {
  if (gameObject.components) {
    const children: GameObjectData[] = []
    for (const child of gameObject.components) {
      if (!isEmptyGameObjectType(child.type)) {
        children.push(child);
      }
    }
    gameObject.components = children;
  }
}

function processGameObjectData(gameObjects: GameObjectData[]): GameObjectData[] {
  const processedNodes = processGameObjectsStructure(gameObjects);
  processedNodes.forEach(processGameObjectsProperties);
  processedNodes.forEach(processGameObjectsCleanUp);
  return processedNodes;
}

export async function generateGameCollectionData(layer: ExportableLayer): Promise<GameCollectionData> {
  const { name } = layer;
  const rootData = getPluginData(layer, "defoldGameObject");
  const rootOptions = generateRootOptions(layer, rootData);
  const collection = convertGameCollectionData(rootData);
  const nodes: GameObjectData[] = [];
  await generateGameObjectData(rootOptions, nodes);
  const processedNodes = processGameObjectData(nodes);
  const textures: TextureData = {};
  await generateTexturesData(layer, textures);
  const filePath = rootData?.path || config.gameObjectDefaultSpecialValues.path;
  return {
    name,
    collection,
    nodes: processedNodes,
    textures,
    filePath
  };
}

export async function generateGameCollectionDataSet(layers: ExportableLayer[]): Promise<GameCollectionData[]> {
  const guiNodesDataSets = layers.map(generateGameCollectionData);
  return Promise.all(guiNodesDataSets);
}
