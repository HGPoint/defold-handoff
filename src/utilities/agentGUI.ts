/**
 * Handles how the agent builds and edits GUI nodes: turns a spec into Figma layers and changes the layers that already exist. The GUI node data goes through the same update the plugin UI runs.
 * @packageDocumentation
 */

import { updateGUINode } from "handoff/gui";
import { PROJECT_CONFIG } from "handoff/project";
import { findMainFigmaComponent, getPluginData, hasPluginData, isFigmaComponentInstance, isFigmaComponentSet, isLayerData } from "utilities/figma";
import { isZeroVector } from "utilities/math";
import { ensureOriginalLayer, findSlice9PlaceholderLayer, isSlice9Layer, tryUpdateSlice9PlaceholderLayerName } from "utilities/slice9";

/**
 * Resolves a solid paint from a color.
 * @param color - The red, green, blue and alpha of the color.
 * @returns The solid paint.
 */
function resolveSolidPaint([r, g, b, opacity]: AgentColor): SolidPaint {
  return { type: "SOLID", color: { r, g, b }, opacity };
}

/**
 * Resolves the font of a text GUI node: its id in the project and its Figma face.
 * @param name - The name of the Defold font.
 * @param fonts - The fonts of the agent project.
 * @returns The font id and the Figma font name.
 */
function resolveFont(name: string, fonts: AgentIndexData["fonts"]): { id: string, fontName: FontName } {
  const face = fonts[name];
  const family = PROJECT_CONFIG.fontFamilies.find((fontFamily) => fontFamily.name === name);
  if (!face || !family) {
    throw new Error(`Unknown font: ${name}`);
  }
  return { id: family.id, fontName: { family: face.family, style: face.style } };
}

/**
 * Changes some of the GUI node data of a Figma layer through the update of the plugin UI.
 * @param layer - The Figma layer to change the data for.
 * @param update - The GUI node data to change.
 */
async function updateNodeData(layer: SceneNode, update: Partial<PluginGUINodeData>): Promise<void> {
  if (isLayerData(layer)) {
    await updateGUINode(layer, update as PluginGUINodeData);
  }
}

/**
 * Moves a Figma layer so that its center lands at a point of its parent.
 * @param layer - The Figma layer to move.
 * @param x - The x of the center.
 * @param y - The y of the center.
 */
export function centerNode(layer: SceneNode, x: number, y: number): void {
  layer.x = x - layer.width / 2;
  layer.y = y - layer.height / 2;
}

/**
 * Places a Figma layer by its center, rotated around it.
 * @param layer - The Figma layer to place.
 * @param center - The center of the layer inside its parent.
 * @param rotation - The rotation of the layer in degrees.
 */
function placeNode(layer: SceneNode & LayoutMixin, [x, y]: AgentPoint, rotation: number = 0): void {
  const { width, height } = layer;
  const angle = rotation * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  layer.relativeTransform = [
    [cos, sin, x - (cos * width + sin * height) / 2],
    [-sin, cos, y - (-sin * width + cos * height) / 2],
  ];
}

/**
 * Adds a created layer to its parent under the name of its spec and updates its GUI node data. The update scales the layer by its scale factor, so the geometry of the layer is set after it.
 * @param layer - The created layer.
 * @param parent - The Figma node to add the layer to.
 * @param name - The name of the spec.
 * @param data - The GUI node data that differs from the defaults.
 * @returns The added layer.
 */
async function addNode<TLayer extends Exclude<ExportableLayer, SliceLayer>>(layer: TLayer, parent: BaseNode & ChildrenMixin, name: string, data: Partial<PluginGUINodeData>): Promise<TLayer> {
  parent.appendChild(layer);
  layer.name = name;
  await updateNodeData(layer, { inferred: true, ...data });
  return layer;
}

/**
 * Builds a box with its children from a spec: fills, adds and sizes the layer, then builds every child inside it.
 * @param layer - The created frame or component.
 * @param spec - The spec of the box GUI node.
 * @param parent - The Figma node to build in.
 * @param index - The index of the page.
 * @returns The built layer.
 */
async function buildBoxNode<TLayer extends FrameNode | ComponentNode>(layer: TLayer, spec: AgentBoxSpecData, parent: BaseNode & ChildrenMixin, index: AgentIndexData): Promise<TLayer> {
  const { name, size: [width, height], fill, clips, data, children = [] } = spec;
  layer.fills = fill ? [resolveSolidPaint(fill)] : [];
  layer.clipsContent = !!clips;
  await addNode(layer, parent, name, data);
  layer.resizeWithoutConstraints(width, height);
  for (const child of children) {
    await buildNode(child, layer, index);
  }
  return layer;
}

/**
 * Builds a component from a spec and indexes it as a template when it is one.
 * @param spec - The spec of the component.
 * @param parent - The Figma node to build in.
 * @param index - The index of the page.
 * @returns The built component.
 */
async function buildComponentNode(spec: AgentComponentSpecData, parent: BaseNode & ChildrenMixin, index: AgentIndexData): Promise<ComponentNode> {
  const layer = await buildBoxNode(figma.createComponent(), spec, parent, index);
  if (spec.data.template) {
    index.templates[`${spec.data.template_path}/${spec.data.template_name}`] = layer;
  }
  return layer;
}

/**
 * Builds a frame from a spec.
 * @param spec - The spec of the frame.
 * @param parent - The Figma node to build in.
 * @param index - The index of the page.
 * @returns The built frame.
 */
function buildFrameNode(spec: AgentFrameSpecData, parent: BaseNode & ChildrenMixin, index: AgentIndexData): Promise<FrameNode> {
  return buildBoxNode(figma.createFrame(), spec, parent, index);
}

/**
 * Builds a sprite instance from a spec. With slices in its GUI node data the instance takes the scale of the spec, the update wraps it into a slice9 placeholder, and the placeholder takes the size.
 * @param spec - The spec of the sprite GUI node.
 * @param parent - The Figma node to build in.
 * @param index - The index of the page.
 * @returns The built sprite instance.
 */
async function buildSpriteNode(spec: AgentSpriteSpecData, parent: BaseNode & ChildrenMixin, index: AgentIndexData): Promise<InstanceNode> {
  const { name, sprite, size: [width, height], scale = 1, data } = spec;
  const component = index.sprites[sprite];
  if (!component) {
    throw new Error(`Missing sprite: ${sprite}`);
  }
  const { slice9, ...unslicedData } = data;
  const layer = await addNode(component.createInstance(), parent, name, unslicedData);
  if (slice9 && !isZeroVector(slice9)) {
    layer.rescale(component.width * scale / layer.width);
    await updateNodeData(layer, { slice9 });
    findSlice9PlaceholderLayer(layer)?.resize(width, height);
  } else {
    layer.resize(width, height);
  }
  return layer;
}

/**
 * Builds a text layer from a spec.
 * @param spec - The spec of the text GUI node.
 * @param parent - The Figma node to build in.
 * @param index - The index of the page.
 * @returns The built text layer.
 */
async function buildTextNode(spec: AgentTextSpecData, parent: BaseNode & ChildrenMixin, index: AgentIndexData): Promise<TextNode> {
  const { name, size: [width, height], text, data } = spec;
  const { id, fontName } = resolveFont(text.font, index.fonts);
  await figma.loadFontAsync(fontName);
  const layer = figma.createText();
  layer.fontName = fontName;
  await addNode(layer, parent, name, { font: id, ...data });
  layer.fontSize = text.fontSize;
  layer.characters = text.characters;
  layer.textAlignHorizontal = text.alignHorizontal;
  layer.textAlignVertical = text.alignVertical;
  layer.lineHeight = text.lineHeight ? { unit: "PIXELS", value: text.lineHeight } : { unit: "AUTO" };
  layer.textAutoResize = text.autoResize;
  layer.resize(width, height);
  layer.fills = [resolveSolidPaint(text.color)];
  layer.strokes = text.outline ? [resolveSolidPaint(text.outline)] : [];
  layer.strokeWeight = text.fontSize * PROJECT_CONFIG.fontStrokeRatio;
  return layer;
}

/**
 * Excludes the children of a template instance from the export: the template brings them itself.
 * @param layer - The template instance.
 */
async function excludeChildren(layer: InstanceNode): Promise<void> {
  for (const child of layer.children) {
    await updateNodeData(child, { exclude: true });
  }
}

/**
 * Hides the named descendants of a layer.
 * @param layer - The Figma layer to search in.
 * @param names - The names of the layers to hide.
 */
function hideNodes(layer: InstanceNode, names: string[]): void {
  for (const name of names) {
    const hidden = layer.findOne((child) => child.name === name);
    if (!hidden) {
      throw new Error(`Nothing to hide: ${name} in ${layer.name}`);
    }
    hidden.visible = false;
  }
}

/**
 * Builds a template instance from a spec: it takes the GUI node data of its template and is scaled to the size of the spec.
 * @param spec - The spec of the template GUI node.
 * @param parent - The Figma node to build in.
 * @param index - The index of the page.
 * @returns The built template instance.
 */
async function buildTemplateNode(spec: AgentTemplateSpecData, parent: BaseNode & ChildrenMixin, index: AgentIndexData): Promise<InstanceNode> {
  const { name, template, size: [width], hidden = [], data } = spec;
  const component = index.templates[template];
  if (!component) {
    throw new Error(`Missing template: ${template}`);
  }
  const layer = component.createInstance();
  await addNode(layer, parent, name, { ...getPluginData(component, "defoldGUINode"), ...data, figma_node_id: layer.id, figma_node_type: layer.type });
  layer.rescale(width / layer.width);
  if (data.replace_template) {
    await excludeChildren(layer);
  }
  hideNodes(layer, hidden);
  return layer;
}

const SPEC_BUILDERS: AgentSpecBuilders = {
  component: buildComponentNode,
  frame: buildFrameNode,
  sprite: buildSpriteNode,
  text: buildTextNode,
  template: buildTemplateNode,
};

/**
 * Builds a GUI node with its children from a spec inside a parent.
 * @param spec - The spec of the GUI node.
 * @param parent - The Figma node to build in: a section for a root, a layer for a child.
 * @param index - The index of the page.
 * @returns The built layer.
 */
export async function buildNode(spec: AgentSpecData, parent: BaseNode & ChildrenMixin, index: AgentIndexData): Promise<Exclude<ExportableLayer, SliceLayer>> {
  const build = SPEC_BUILDERS[spec.kind] as AgentSpecBuilder<AgentSpecData>;
  if (!build) {
    throw new Error(`build: unknown kind ${spec.kind} of ${spec.name}`);
  }
  if (parent.children.some((child) => ensureOriginalLayer(child).name === spec.name)) {
    throw new Error(`build: ${spec.name} already exists in ${parent.name}`);
  }
  const layer = await build(spec, parent, index);
  if (spec.center) {
    placeNode(findSlice9PlaceholderLayer(layer) ?? layer, spec.center, spec.rotation);
  }
  return layer;
}

/**
 * Finds a GUI node by its id inside a root: its slice9 placeholder when it has one, otherwise the layer itself.
 * @param root - The Figma layer to search in.
 * @param name - The id of the GUI node.
 * @returns The found layer, or null.
 */
export function findNode(root: SceneNode & ChildrenMixin, name: string): WithNull<SceneNode> {
  const layer = root.findOne((candidate) => candidate.name === name);
  return layer && (findSlice9PlaceholderLayer(layer) ?? layer);
}

/**
 * Changes the font size of a text layer, resizing it around its center.
 * @param layer - The text layer.
 * @param fontSize - The font size.
 * @param size - The width and height of the layer.
 */
export function setFontSize(layer: TextNode, fontSize: number, [width, height]: AgentPoint): void {
  const { x, y, width: oldWidth, height: oldHeight } = layer;
  layer.fontSize = fontSize;
  layer.strokeWeight = fontSize * PROJECT_CONFIG.fontStrokeRatio;
  layer.resize(width, height);
  centerNode(layer, x + oldWidth / 2, y + oldHeight / 2);
}

/**
 * Renames a Figma layer: a GUI node by its id, which its layer follows, any other layer by its name. The slice9 placeholder of the layer follows too.
 * @param layer - The Figma layer to rename.
 * @param name - The new id.
 */
async function renameNode(layer: SceneNode, name: string): Promise<void> {
  if (hasPluginData(layer, "defoldGUINode")) {
    await updateNodeData(layer, { id: name });
  } else {
    layer.name = name;
  }
  if (isSlice9Layer(layer)) {
    tryUpdateSlice9PlaceholderLayerName(layer);
  }
}

/**
 * Renames the GUI nodes inside a Figma layer, following template instances with the names of their templates.
 * @param layer - The Figma layer to rename the descendants of.
 * @param renames - The new ids by the old ones, for every component by its name.
 * @param names - The new ids by the old ones for the layer itself.
 */
export async function renameNodes(layer: SceneNode, renames: Record<string, Record<string, string>>, names: Record<string, string> = {}): Promise<void> {
  for (const child of "children" in layer ? layer.children : []) {
    if (names[child.name]) {
      await renameNode(child, names[child.name]);
    }
    const main = isFigmaComponentInstance(child) ? await findMainFigmaComponent(child) : null;
    if (!main) {
      await renameNodes(child, renames, names);
    } else if (!main.parent || !isFigmaComponentSet(main.parent)) {
      await renameNodes(child, renames, renames[main.name] ?? {});
    }
  }
}
