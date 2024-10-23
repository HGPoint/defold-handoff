import config from "config/config.json";

/**
 * Injects default game collection values.
 * @returns Default game collection values.
 */
function injectGameCollectionDefaults() {
  return config.gameCollectionDefaultValues;
}

/**
 * Resolves the name for a game collection.
 * @param data - Root game object data.
 * @returns The resolved name.
 */
function resolveName(data: PluginGameObjectData | null | undefined) {
  return data?.id ? data.id : config.gameCollectionDefaultValues.name;
}

/**
 * Converts game collection data.
 * @returns Converted game collection data.
 */
export function convertGameCollectionData(rootData: PluginGameObjectData | null | undefined): GameCollectionComponentData {
  const name = resolveName(rootData)
  const defaults = injectGameCollectionDefaults();
  return {
    ...defaults,
    name,
  };
}