import config from "config/config.json";

function injectSpriteDefaults() {
  return config.atlasImageDefaultValues;
}

export function convertSpriteData(): SpriteComponentData {
  const defaults = injectSpriteDefaults();
  return {
    ...defaults,
  };
}

function injectAtlasDefaults() {
  return config.atlasDefaultValues;
}

export function convertAtlasData(): AtlasComponentData {
  const defaults = injectAtlasDefaults();
  return {
    ...defaults,
  };
}
