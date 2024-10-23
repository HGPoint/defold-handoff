/**
 * Serializes game object data.
 * @param guiData - Game object data to be serialized.
 * @returns Serialized game object data.
 */
export function serializeGameObjectData(guiData: GameObjectData): SerializedGameObjectData {
  const { name } = guiData;
  return {
    name,
  };
}

/**
 * Serializes an array of game object data.
 * @param gameObjectDataSet - Array of game object data to be serialized.
 * @returns Array of serialized game object data.
 */
export function serializeGameObjectDataSet(gameObjectDataSet: GameObjectData[]): SerializedGameObjectData[] {
  return gameObjectDataSet.map(serializeGameObjectData);
}
