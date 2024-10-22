/**
 * Utility module for handling Defold game objects.
 * @packageDocumentation
 */

import { isFigmaText, isAtlasSprite } from "utilities/figma";

export async function resolvesGameObjectType(layer: ExportableLayer): Promise<GameObjectType> {
  if (isFigmaText(layer)) {
    return "TYPE_LABEL";
  }
  if (await isAtlasSprite(layer)) {
    return "TYPE_SPRITE";
  }
  return "TYPE_EMPTY";
}
