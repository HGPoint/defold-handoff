/**
 * Generates game object data for a given Figma layer, including textures.
 * @async
 * @param layer - The Figma layer to generate game object data for.
 * @returns Game object data.
 */
export async function generateGameObjectData(layer: ExportableLayer): Promise<GameObjectData> {
  const { name } = layer;
  return {
    name,
  };
}

export async function generateGameObjectDataSet(layers: ExportableLayer[]): Promise<GameObjectData[]> {
  const guiNodesDataSets = layers.map(generateGameObjectData);
  return Promise.all(guiNodesDataSets);
}
