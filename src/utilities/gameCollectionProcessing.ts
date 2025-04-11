/**
 * Handles game-related data processing and transformation.
 * @packageDocumentation
 */

import { isGameObjectEmptyType, isGameObjectLabelType, isGameObjectSpriteType } from "utilities/gameCollection";
import { inferGameObject } from "utilities/inference";
import { tryRestoreSlice9LayerData } from "utilities/slice9";

const EMPTY_COMPONENT_PROPERTIES = [
  "type",
  "id",
  "position",
  "rotation",
  "scale",
  "children",
  "components",
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
  "leading",
  "tracking",
  "pivot",
  "blend_mode",
];

/**
 * Preprocesses the game object layer before export.
 * @param layer - The Figma layer to preprocess.
 * @returns The game object layer.
 */
export async function preprocessGameCollectionData(layer: ExportableLayer): Promise<ExportableLayer> {
  await inferGameObject(layer);
  await tryRestoreSlice9LayerData(layer, "defoldGameObject");
  return layer;
}

/**
 * Postprocesses game collection data after export.
 * @param gameCollection - The game collection data to postprocess.
 * @returns The postprocessed game collection data.
 */
export function postprocessGameCollectionData(gameCollection: GameCollectionData): Promise<GameCollectionData> {
  const { gameObjects } = gameCollection;
  sanitizeGameObjectIDs(gameObjects);
  const restructuredGameObjects = restructureGameObjects(gameObjects);
  restructuredGameObjects.forEach(cleanupGameObjectProperties);
  restructuredGameObjects.forEach(cleanupGameObjectComponents);
  gameCollection.gameObjects = restructuredGameObjects;
  return Promise.resolve(gameCollection);
}

function sanitizeGameObjectIDs(gameObjects: GameObjectData[]) {
  gameObjects.forEach((gameObject) => { sanitizeGameObjectID(gameObject, gameObjects) });
}

function sanitizeGameObjectID(gameObject: GameObjectData, gameObjects: GameObjectData[], usedIDs: string[] = []) {
  const { id } = gameObject;
  let newGameObjectID: string;
  if (usedIDs.includes(id)) {
    let gameObjectIndex = 1;
    newGameObjectID = resolveGameObjectID(id, gameObjectIndex);
    while (usedIDs.includes(newGameObjectID)) {
      gameObjectIndex += 1;
      newGameObjectID = resolveGameObjectID(id, gameObjectIndex);
    }
    gameObject.id = newGameObjectID;
    for (const otherGameObject of gameObjects) {
      if (otherGameObject !== gameObject && otherGameObject.children && otherGameObject.figma_children) {
        const childIndex = otherGameObject.figma_children.indexOf(gameObject.exportable_layer_id);
        if (childIndex !== -1) {
          otherGameObject.children[childIndex] = gameObject.id;
          break;
        }
      }
    }
  }
  usedIDs.push(gameObject.id);
}

function resolveGameObjectID(originalID: string, index: number): string {
  return `${originalID}_${index}`;
}

/**
 * Restructures game collection data after export.
 * @param gameObjects - The game objects to restructure.
 * @returns The restructured game collection data.
 */
function restructureGameObjects(gameObjects: GameObjectData[]) {
  const processedNodes: GameObjectData[] = [];
  for (const gameObject of gameObjects) {
    if (isGameObjectEmptyType(gameObject.type)) {
      processedNodes.push(gameObject);
      if (gameObject.components && gameObject.components.length > 0) {
        const children = restructureGameObjects(gameObject.components);
        if (children && children.length) {
          refreshGameObjectChildren(gameObject, children);
          processedNodes.push(...children);
        }
      }
    }
  }
  return processedNodes;
}

/**
 * Refreshes game object children after restructuring.
 * @param gameObject - The game object.
 * @param children - The children.
 */
function refreshGameObjectChildren(gameObject: GameObjectData, children: GameObjectData[]) {
  if (!gameObject.children) {
    gameObject.children = [];
  }
  for (const child of children) {
    if (!gameObject.children.includes(child.id)) {
      gameObject.children.push(child.id);
    }
  }
}

/**
 * Cleans up game object properties after export.
 * @param gameObject - The game object to clean up.
 */
function cleanupGameObjectProperties(gameObject: GameObjectData) {
  const keys = Object.keys(gameObject) as (keyof GameObjectData)[];
  for (const key of keys) {
    if (shouldRemoveProperty(key, gameObject.type)) {
      delete gameObject[key];
    }
    if (gameObject.components) {
      gameObject.components.forEach(cleanupGameObjectProperties);
    }
  }
}

/**
 * Checks if a property should be removed from the game object.
 * @param key - The property to check.
 * @param type - The game object type.
 * @returns True if the property should be removed, false otherwise.
 */
function shouldRemoveProperty(key: keyof GameObjectData, type?: GameObjectType) {
  if (isGameObjectSpriteType(type)) {
    return !SPRITE_COMPONENT_PROPERTIES.includes(key);
  }
  if (isGameObjectLabelType(type)) {
    return !LABEL_COMPONENT_PROPERTIES.includes(key);
  }
  if (isGameObjectEmptyType(type)) {
    return !EMPTY_COMPONENT_PROPERTIES.includes(key);
  }
  return true;
}

/**
 * Cleans up game object components after export.
 * @param gameObject - The game object to clean up.
 */
function cleanupGameObjectComponents(gameObject: GameObjectData) {
  if (gameObject.components) {
    const children: GameObjectData[] = []
    for (const child of gameObject.components) {
      if (!isGameObjectEmptyType(child.type)) {
        children.push(child);
      }
    }
    gameObject.components = children;
  }
}
