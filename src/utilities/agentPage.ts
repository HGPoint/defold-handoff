/**
 * Handles what the agent reads from the current page: the sections, roots and atlases Handoff exports, the sprites and templates behind instances, and the description of layers.
 * @packageDocumentation
 */

import config from "config/config.json";
import { updateSection } from "handoff/section";
import { resolveAtlasName } from "utilities/atlas";
import { convertSpriteName } from "utilities/atlasConversion";
import { injectGUINodeDefaults } from "utilities/defaults";
import { findMainFigmaComponent, getPluginData, isFigmaComponent, isFigmaComponentInstance, isFigmaComponentSet, isFigmaPage, isFigmaSection, isFigmaText, isLayerAtlas, isLayerContextSection, isLayerData, isSolidPaint } from "utilities/figma";

/**
 * Finds the sections of the current page that Handoff exports.
 * @param isAtlas - Whether to find the atlas sections or the GUI sections.
 * @returns The found sections.
 */
export function findPageSections(isAtlas: boolean): SectionNode[] {
  const sections = figma.currentPage.children.filter(isLayerContextSection);
  return sections.filter((section) => !!getPluginData(section, "defoldSection")?.jumbo === isAtlas);
}

/**
 * Finds the GUI roots of the current page: the children of its GUI sections.
 * @returns The found GUI roots.
 */
export function findPageRoots(): SceneNode[] {
  return findPageSections(false).flatMap((section) => section.children.filter((child) => !isFigmaText(child)));
}

/**
 * Finds the atlases of the current page: the component sets of its atlas sections.
 * @returns The found atlases.
 */
export function findPageAtlases(): ComponentSetNode[] {
  return findPageSections(true).flatMap((section) => section.children.filter(isFigmaComponentSet));
}

/**
 * Finds the section of the current page that is exported as the atlas.
 * @param atlas - The name of the atlas.
 * @returns The atlas section if found, otherwise null.
 */
export function findPageAtlasSection(atlas: string): WithNull<SectionNode> {
  const section = findPageSections(true).find((candidate) => getPluginData(candidate, "defoldSection")?.jumbo === atlas);
  return section ?? null;
}

/**
 * Finds the section by its name inside a parent, creating it if there is none, and binds the section data when given.
 * @param parent - The Figma node to hold the section.
 * @param name - The name of the section.
 * @param data - The section data to bind.
 * @returns The section.
 */
export function ensureSection(parent: BaseNode & ChildrenMixin, name: string, data?: Partial<PluginSectionData>): SectionNode {
  let section = parent.children.filter(isFigmaSection).find((child) => !child.removed && child.name === name);
  if (!section) {
    section = figma.createSection();
    section.name = name;
    parent.appendChild(section);
  }
  if (data) {
    updateSection(section, { ...config.sectionDefaultValues, layers: [], ...data, id: section.id });
  }
  return section;
}

/**
 * Finds the root of a Figma layer: its topmost ancestor inside a section or a page.
 * @param layer - The Figma layer to find the root for.
 * @returns The root.
 */
export function findRoot(layer: SceneNode): SceneNode {
  let root = layer;
  while (root.parent && !isFigmaSection(root.parent) && !isFigmaPage(root.parent)) {
    root = root.parent as SceneNode;
  }
  return root;
}

/**
 * Determines whether a Figma layer lies inside a component instance.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is nested in an instance, otherwise false.
 */
export function isNestedInInstance(layer: SceneNode): boolean {
  for (let parent = layer.parent; parent && !isFigmaSection(parent); parent = parent.parent) {
    if (isFigmaComponentInstance(parent)) {
      return true;
    }
  }
  return false;
}

/**
 * Finds the image paint among the fills of a Figma layer.
 * @param layer - The Figma layer to check.
 * @returns The image paint if found, otherwise null.
 */
function findImagePaint(layer: BaseNode): WithNull<ImagePaint> {
  if ("fills" in layer && Array.isArray(layer.fills)) {
    const fills: Paint[] = layer.fills;
    const paint = fills.find((fill): fill is ImagePaint => fill.type === "IMAGE");
    return paint ?? null;
  }
  return null;
}

/**
 * Indexes what GUI nodes refer to by name: the sprites and the templates of the current page and the fonts of the agent project.
 * @param fonts - The fonts of the agent project.
 * @returns The index.
 */
export function indexPage(fonts: Record<string, AgentFontData> = {}): AgentIndexData {
  const index: AgentIndexData = { sprites: {}, spriteKeys: {}, spriteHashes: {}, templates: {}, templateKeys: {}, fonts };
  for (const atlas of figma.currentPage.findAllWithCriteria({ types: ["COMPONENT_SET"] }).filter(isLayerAtlas)) {
    const atlasName = resolveAtlasName(atlas);
    for (const sprite of atlas.children.filter(isFigmaComponent)) {
      const key = `${atlasName}/${convertSpriteName(sprite)}`;
      const paint = findImagePaint(sprite.children[0]);
      index.sprites[key] = sprite;
      index.spriteKeys[sprite.id] = key;
      if (paint?.imageHash) {
        index.spriteHashes[paint.imageHash] = key;
      }
    }
  }
  for (const component of figma.currentPage.findAllWithCriteria({ types: ["COMPONENT"] })) {
    const data = getPluginData(component, "defoldGUINode");
    if (data?.template) {
      const key = `${data.template_path}/${data.template_name}`;
      index.templates[key] = component;
      index.templateKeys[component.id] = key;
    }
  }
  return index;
}

/**
 * Converts a solid paint to a color.
 * @param paints - The paints of a Figma layer.
 * @returns The color of the first paint if it is solid, otherwise null.
 */
function describeColor(paints: readonly Paint[] | typeof figma.mixed): WithNull<AgentColor> {
  const paint = Array.isArray(paints) ? paints[0] : null;
  if (paint && isSolidPaint(paint)) {
    const { color: { r, g, b }, opacity = 1 } = paint;
    return [r, g, b, opacity];
  }
  return null;
}

/**
 * Describes the non-default GUI node data bound to a Figma layer.
 * @param layer - The Figma layer to describe the data for.
 * @returns The data that differs from the defaults, or undefined if the layer has none.
 */
function describeData(layer: BaseNode): Partial<PluginGUINodeData> | undefined {
  const data = isLayerData(layer) ? getPluginData(layer, "defoldGUINode") : null;
  if (!data) {
    return undefined;
  }
  const defaults: Record<string, unknown> = { ...injectGUINodeDefaults(), inferred: true };
  const entries = Object.entries(data).filter(([key, value]) => !key.startsWith("figma_node_") && JSON.stringify(value) !== JSON.stringify(defaults[key]));
  return Object.fromEntries(entries);
}

/**
 * Describes the styles of a text layer.
 * @param layer - The text layer to describe.
 * @returns The text data.
 */
function describeText(layer: TextNode): AgentTextData {
  return {
    characters: layer.characters,
    font: layer.fontName === figma.mixed ? "mixed" : layer.fontName,
    fontSize: layer.fontSize === figma.mixed ? "mixed" : layer.fontSize,
    color: describeColor(layer.fills),
    outline: describeColor(layer.strokes),
    outlineWeight: layer.strokeWeight === figma.mixed ? "mixed" : layer.strokeWeight,
    alignHorizontal: layer.textAlignHorizontal,
    alignVertical: layer.textAlignVertical,
  };
}

/**
 * Describes what stands behind a component instance: a sprite, a template, or a component Handoff does not know.
 * @param layer - The Figma layer to describe.
 * @param index - The index of the page.
 * @returns The source data.
 */
async function describeSource(layer: BaseNode, index: AgentIndexData): Promise<Pick<AgentNodeData, "sprite" | "template" | "foreign">> {
  const main = isFigmaComponentInstance(layer) ? await findMainFigmaComponent(layer) : null;
  if (!main) {
    return {};
  }
  const sprite = index.spriteKeys[main.id];
  const template = index.templateKeys[main.id];
  return { sprite, template, foreign: sprite || template ? undefined : main.name };
}

/**
 * Describes the image fill of a Figma layer: the sprite it repeats, or its hash and source size.
 * @param layer - The Figma layer to describe.
 * @param index - The index of the page.
 * @returns The image data.
 */
async function describeImage(layer: BaseNode, index: AgentIndexData): Promise<Pick<AgentNodeData, "image" | "imageSize">> {
  const hash = findImagePaint(layer)?.imageHash;
  if (!hash) {
    return {};
  }
  if (index.spriteHashes[hash]) {
    return { image: index.spriteHashes[hash] };
  }
  const size = await figma.getImageByHash(hash)?.getSizeAsync();
  return { image: hash, imageSize: size ? [size.width, size.height] : undefined };
}

/**
 * Describes the geometry and the looks of a Figma layer.
 * @param layer - The Figma layer to describe.
 * @returns The geometry data.
 */
function describeGeometry(layer: PageNode | SceneNode): Partial<AgentNodeData> {
  if (isFigmaPage(layer)) {
    return {};
  }
  const { x, y, width: w, height: h, visible } = layer;
  const rotation = "rotation" in layer && layer.rotation ? layer.rotation : undefined;
  const opacity = "opacity" in layer && layer.opacity !== 1 ? layer.opacity : undefined;
  const effects = "effects" in layer && layer.effects.length ? layer.effects.map((effect) => effect.type) : undefined;
  const fills = "fills" in layer && Array.isArray(layer.fills) ? (layer.fills as Paint[]).filter((fill) => fill.visible !== false && isSolidPaint(fill)) : [];
  return { x, y, w, h, rotation, hidden: visible ? undefined : true, opacity, fill: describeColor(fills) ?? undefined, effects };
}

/**
 * Describes a Figma page or layer with its children down to a depth.
 * @param layer - The Figma page or layer to describe.
 * @param index - The index of the page.
 * @param depth - The depth of children to describe.
 * @returns The node data.
 */
export async function describeNode(layer: PageNode | SceneNode, index: AgentIndexData, depth: number): Promise<AgentNodeData> {
  const children = depth > 0 && "children" in layer ? layer.children : [];
  return {
    id: layer.id,
    name: layer.name,
    type: layer.type,
    ...describeGeometry(layer),
    ...await describeSource(layer, index),
    ...await describeImage(layer, index),
    text: isFigmaText(layer) ? describeText(layer) : undefined,
    data: describeData(layer),
    children: children.length ? await Promise.all(children.map((child) => describeNode(child, index, depth - 1))) : undefined,
  };
}
