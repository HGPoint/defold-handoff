/**
 * Handles how the agent manages atlas sprites: adds pictures to the groups of an atlas section, moves sprites between groups, and replaces the picture of a sprite.
 * @packageDocumentation
 */

import config from "config/config.json";
import { centerNode } from "utilities/agentGUI";
import { findRoot, isNestedInInstance } from "utilities/agentPage";
import { createAtlasLayer, createSpriteLayer, packSpritesBySize } from "utilities/atlas";
import { convertSpriteName } from "utilities/atlasConversion";
import { getPluginData, isFigmaComponent, isFigmaComponentSet, isLayerData, layerSorterByName } from "utilities/figma";
import { isSlice9Layer, tryRefreshSlice9 } from "utilities/slice9";

const ATLAS_ASPECT = 1.4;

/**
 * Finds the group of sprites by its name inside an atlas section.
 * @param section - The atlas section.
 * @param group - The name of the group.
 * @returns The component set of the group if found, otherwise null.
 */
function findGroup(section: SectionNode, group: string): WithNull<ComponentSetNode> {
  const atlas = section.children.filter(isFigmaComponentSet).find((child) => child.name === group);
  return atlas ?? null;
}

/**
 * Creates a group of sprites inside an atlas section.
 * @param section - The atlas section.
 * @param group - The name of the group.
 * @param sprites - The sprites of the group.
 * @returns The component set of the group.
 */
function createGroup(section: SectionNode, group: string, sprites: ComponentNode[]): ComponentSetNode {
  const atlas = createAtlasLayer(sprites);
  atlas.name = group;
  section.appendChild(atlas);
  return atlas;
}

/**
 * Packs the sprites of a group into a width chosen for them and fits the group to the result.
 * @param atlas - The component set of the group.
 */
function packAtlas(atlas: ComponentSetNode): void {
  const padding = config.atlasPadding;
  const sprites = atlas.children;
  const area = sprites.reduce((sum, sprite) => sum + (sprite.width + padding) * (sprite.height + padding), 0);
  const widest = Math.max(...sprites.map((sprite) => sprite.width));
  const width = Math.max(widest, Math.ceil(Math.sqrt(area) * ATLAS_ASPECT)) + padding * 2;
  atlas.resizeWithoutConstraints(width, atlas.height);
  packSpritesBySize(atlas);
  const right = Math.max(...sprites.map((sprite) => sprite.x + sprite.width));
  const bottom = Math.max(...sprites.map((sprite) => sprite.y + sprite.height));
  atlas.resizeWithoutConstraints(right + padding, bottom + padding);
}

/**
 * Sorts the groups of an atlas section and the sprites inside them by name: this is the order of the images in the exported atlas.
 * @param section - The atlas section.
 */
export function sortAtlases(section: SectionNode): void {
  const atlases = section.children.filter(isFigmaComponentSet).sort(layerSorterByName);
  for (const atlas of atlases) {
    [...atlas.children].sort(layerSorterByName).forEach((sprite) => atlas.appendChild(sprite));
    section.appendChild(atlas);
  }
}

/**
 * Creates a sprite from a PNG image.
 * @param name - The name of the sprite.
 * @param bytes - The PNG image.
 * @returns The sprite component.
 */
async function createSprite(name: string, bytes: Uint8Array): Promise<ComponentNode> {
  const image = figma.createImage(bytes);
  const { width, height } = await image.getSizeAsync();
  const picture = figma.createRectangle();
  picture.name = name;
  picture.resize(width, height);
  picture.fills = [{ type: "IMAGE", scaleMode: "FILL", imageHash: image.hash }];
  const sprite = createSpriteLayer(picture);
  picture.constraints = { horizontal: "SCALE", vertical: "SCALE" };
  return sprite;
}

/**
 * Adds PNG images as sprites to a group of an atlas section, creating the group if there is none. Sprites that already exist are skipped.
 * @param section - The atlas section.
 * @param group - The name of the group.
 * @param files - The PNG images by the names of their sprites.
 * @returns The component set of the group.
 */
export async function importAtlasSprites(section: SectionNode, group: string, files: Record<string, Uint8Array>): Promise<ComponentSetNode> {
  const existing = findGroup(section, group);
  const names = Object.keys(files).filter((name) => !existing?.children.some((child) => convertSpriteName(child) === name));
  const sprites = await Promise.all(names.map((name) => createSprite(name, files[name])));
  const atlas = existing ?? createGroup(section, group, sprites);
  sprites.filter((sprite) => sprite.parent !== atlas).forEach((sprite) => atlas.appendChild(sprite));
  packAtlas(atlas);
  sortAtlases(section);
  return atlas;
}

/**
 * Moves and renames sprites between the groups of an atlas section, creating the groups that do not exist.
 * @param section - The atlas section.
 * @param moves - The new group and name of a sprite by its old name.
 */
export function moveSprites(section: SectionNode, moves: Record<string, [string, string]>): void {
  const groups: Record<string, [ComponentNode, string][]> = {};
  for (const atlas of section.children.filter(isFigmaComponentSet)) {
    for (const sprite of atlas.children.filter(isFigmaComponent)) {
      const oldName = convertSpriteName(sprite);
      const [group, name] = moves[oldName] ?? [atlas.name, oldName];
      groups[group] = [...(groups[group] ?? []), [sprite, name]];
    }
  }
  for (const [group, items] of Object.entries(groups)) {
    const sprites = items.map(([sprite]) => sprite);
    const atlas = findGroup(section, group) ?? createGroup(section, group, sprites);
    sprites.filter((sprite) => sprite.parent !== atlas).forEach((sprite) => atlas.appendChild(sprite));
    for (const [sprite, name] of items) {
      sprite.name = `Sprite=${name}`;
      sprite.children[0].name = name;
    }
  }
  sortAtlases(section);
  section.children.filter(isFigmaComponentSet).forEach(packAtlas);
}

/**
 * Fits a sprite instance to the new picture of its sprite and describes it: a slice9 one gets its cells rebuilt, an auto-sized one keeps its center.
 * @param instance - The sprite instance.
 * @param size - The width and height of the new picture.
 * @param factor - The scale the instance had against the old picture.
 * @param center - The center the instance had before the picture changed.
 * @returns The sprite instance data.
 */
async function refitSpriteInstance(instance: InstanceNode, [width, height]: AgentPoint, factor: number, [x, y]: AgentPoint): Promise<AgentSpriteInstanceData> {
  const data = isLayerData(instance) ? getPluginData(instance, "defoldGUINode") : null;
  const kind = isSlice9Layer(instance) ? "slice9" : data?.size_mode === "SIZE_MODE_AUTO" ? "auto" : "manual";
  if (kind === "slice9") {
    instance.resize(width * factor, height * factor);
    await tryRefreshSlice9(instance);
  } else if (kind === "auto") {
    instance.resize(width * factor, height * factor);
    centerNode(instance, x, y);
  }
  return { id: instance.id, root: findRoot(instance).name, node: instance.name, kind, slice9: data?.slice9 };
}

/**
 * Replaces the picture of a sprite, keeping its instances in place.
 * @param sprite - The sprite component.
 * @param bytes - The PNG image.
 * @returns The instances of the sprite with what was done to each.
 */
export async function updateAtlasSprite(sprite: ComponentNode, bytes: Uint8Array): Promise<AgentSpriteInstanceData[]> {
  const image = figma.createImage(bytes);
  const { width, height } = await image.getSizeAsync();
  const instances = (await sprite.getInstancesAsync()).filter((instance) => !isNestedInInstance(instance));
  const factors = instances.map((instance) => instance.width / sprite.width);
  const centers = instances.map(({ x, y, width: instanceWidth, height: instanceHeight }): AgentPoint => [x + instanceWidth / 2, y + instanceHeight / 2]);
  const [picture] = sprite.children;
  sprite.resizeWithoutConstraints(width, height);
  picture.x = 0;
  picture.y = 0;
  (picture as RectangleNode).resize(width, height);
  (picture as RectangleNode).fills = [{ type: "IMAGE", scaleMode: "FILL", imageHash: image.hash }];
  if (sprite.parent && isFigmaComponentSet(sprite.parent)) {
    packAtlas(sprite.parent);
  }
  return Promise.all(instances.map((instance, index) => refitSpriteInstance(instance, [width, height], factors[index], centers[index])));
}
