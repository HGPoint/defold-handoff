/**
 * Provides endpoints for managing atlas-related features, including creating, updating, and exporting atlases.
 * @packageDocumentation
 */

import { appendSprites, ATLAS_EXPORT_PIPELINE, ATLAS_SERIALIZATION_PIPELINE, ATLAS_UPDATE_PIPELINE, canExtractSprite, createAtlasLayer, createSpriteLayers, distributeSprites, extractSprite, fitAtlas, fixAtlas, removeAtlas, tryRestoreAtlasLayer } from "utilities/atlas";
import { packAtlases } from "utilities/atlasExport";
import { combineAtlases, spreadAtlasGroups } from "utilities/atlasProcessing";
import { isFigmaComponentInstance } from "utilities/figma";
import { GAME_COLLECTION_ATLASES_EXTRACT_PIPELINE } from "utilities/gameCollection";
import { GUI_ATLASES_EXTRACT_PIPELINE } from "utilities/gui";
import { packGUI } from "utilities/guiExport";
import { extractUsedSpriteData } from "utilities/sprite";
import { runTransformPipelines } from "utilities/transformPipeline";
import { runUpdatePipeline } from "utilities/updatePipeline";

/**
 * Exports serialized atlases containing sprites as Uint8Arrays from an array of atlas layers.
 * @param layers - The atlases and dynamic pseudo-atlases to export.
 * @param scale - The scale factor to apply to the atlas sprites. Defaults to 1.
 * @returns An array of serialized atlas data.
 */
export async function exportAtlases(layers: AtlasLayer[], scale: number = 1, usedSprites: string[] = []): Promise<SerializedAtlasData[]> {
  const data = packAtlases(layers, scale, usedSprites);
  const exportAtlasData = await runTransformPipelines(ATLAS_EXPORT_PIPELINE, data);
  const combinedAtlasData = combineAtlases(exportAtlasData);
  const serializedAtlasData = await runTransformPipelines(ATLAS_SERIALIZATION_PIPELINE, combinedAtlasData);
  return serializedAtlasData;
}

/**
 * Exports serialized atlases containing sprites as Uint8Arrays extracted from an array of GUI layers.
 * @param layers - The GUI nodes to use for extracting atlases.
 * @returns An array of serialized atlas data.
 */
export async function exportGUIAtlases(layers: Exclude<ExportableLayer, SliceLayer>[], onlyUsedSprites: boolean, options: GUIPackOptions): Promise<SerializedAtlasData[]> {
  const { collapseTemplates } = options;
  const guiData = packGUI(layers, options);
  const guiAtlasLayers = await runTransformPipelines(GUI_ATLASES_EXTRACT_PIPELINE, guiData);
  const atlasLayers = spreadAtlasGroups(guiAtlasLayers);
  const usedSprites = onlyUsedSprites ? await extractUsedSpriteData(layers, collapseTemplates) : [];
  const serializedAtlasData = await exportAtlases(atlasLayers, 1, usedSprites);
  return serializedAtlasData;
}

/**
 * Exports serialized atlases containing sprites as Uint8Arrays extracted from an array of game object or collection layers.
 * @param layers - The game objects or collections to use for extracting atlases.    
 * @returns An array of serialized atlas data.
 */
export async function exportGameCollectionAtlases(layers: Exclude<ExportableLayer, SliceLayer>[]): Promise<SerializedAtlasData[]> {
  const gameCollectionAtlasLayers = await runTransformPipelines(GAME_COLLECTION_ATLASES_EXTRACT_PIPELINE, layers);
  const atlasLayers = spreadAtlasGroups(gameCollectionAtlasLayers);
  const serializedAtlasData = await exportAtlases(atlasLayers);
  return serializedAtlasData;
}

/**
 * Creates an atlas from an array of Figma layers used as sprites.
 * @param layers - The Figma layers to use as sprites.
 * @returns The created atlas layer.
 */
export function createAtlas(layers: SceneNode[]) {
  const sprites = createSpriteLayers(layers);
  const atlas = createAtlasLayer(sprites);
  return atlas;
}

/**
 * Attempts to restore atlases from an array of Figma layers. Some layers may not be restorable as atlases.
 * @param layers - The Figma layers to attempt restoring atlas data from.
 */
export function tryRestoreAtlases(layers: SceneNode[]) {
  layers.forEach(tryRestoreAtlasLayer);
}

/**
 * Adds new sprites to an existing atlas.
 * @param atlas - The atlas to add the sprites to.
 * @param layers - The Figma layers to add as sprites.
 */
export function addSprites(atlas: ComponentSetNode, layers: SceneNode[]) {
  const sprites = createSpriteLayers(layers);
  appendSprites(atlas, sprites);
}

export async function updateAtlas(layer: ComponentSetNode, update: PluginAtlasData) {
  const result = await runUpdatePipeline(ATLAS_UPDATE_PIPELINE, layer, update); 
  return result;
}

/**
 * Destroys an array of atlases, by removing bound atlas data from the Figma layers.
 * @param layers - The atlases to destroy.
 */
export function removeAtlases(layers: DataLayer[]) {
  layers.forEach(removeAtlas);
}

/**
 * Fixes general issues in an array of atlases.
 * @param layers - The atlases to fix.
 */
export function fixAtlases(layers: ComponentSetNode[]) {
  layers.forEach(fixAtlas);
}

/**
 * Sorts sprites within each atlas in an array of atlases.
 * @param layers - The atlases whose sprites should be sorted.
 */
export function sortAtlases(layers: ComponentSetNode[]) {
  layers.forEach(distributeSprites);
}

/**
 * Adjusts each atlas in an array to fit tightly around their sprites.
 * @param layers - The atlases to adjust.
 */
export function fitAtlases(layers: ComponentSetNode[]) {
  layers.forEach(fitAtlas);
}

/**
 * Attempts to locate and extract a sprite image from an atlas by reference.
 * @param layer - The reference Figma layer to locate and extract the sprite by.
 * @returns The extracted image as a Uint8Array, or null if no sprite could be extracted.
 */
export async function tryExtractSprite(layer: SceneNode): Promise<WithNull<Uint8Array>> {
  if (isFigmaComponentInstance(layer) && await canExtractSprite(layer)) {
    const sprite = await extractSprite(layer)
    return sprite;
  }
  return null;
}
