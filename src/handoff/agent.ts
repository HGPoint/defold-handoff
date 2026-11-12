/**
 * Provides endpoints for the agent mode, allowing an external agent to find, inspect, select, and capture Figma layers, to export the page, and to run code against the Figma Plugin API with the library that builds GUI nodes and manages atlas sprites.
 * @packageDocumentation
 */

import { exportAtlases, updateAtlas } from "handoff/atlas";
import { exportGUI, updateGUINode } from "handoff/gui";
import { updateSection } from "handoff/section";
import { importAtlasSprites, moveSprites, sortAtlases, updateAtlasSprite } from "utilities/agentAtlas";
import { buildNode, centerNode, findNode, renameNodes, setFontSize } from "utilities/agentGUI";
import { describeNode, ensureSection, findPageAtlasSection, findPageAtlases, findPageRoots, findPageSections, indexPage } from "utilities/agentPage";
import { convertSpriteName } from "utilities/atlasConversion";
import { getPluginData, isFigmaDocument, isFigmaPage, selectFigmaLayers } from "utilities/figma";
import { pickGUIFromSelectionData, reduceAtlasesFromSelectionData, reduceSelectionDataFromLayers } from "utilities/selection";

const FIND_LIMIT = 200;
const CAPTURE_SCALE = 1;
const INSPECT_DEPTH = 1;

/**
 * Determines whether the Figma node is a scene node.
 * @param node - The Figma node to check.
 * @returns True if the Figma node is a scene node, otherwise false.
 */
function isSceneNode(node: WithNull<BaseNode>): node is SceneNode {
  return !!node && !isFigmaDocument(node) && !isFigmaPage(node);
}

/**
 * Determines whether the Figma node is a page or a scene node.
 * @param node - The Figma node to check.
 * @returns True if the Figma node is a page or a scene node, otherwise false.
 */
function isPageOrSceneNode(node: WithNull<BaseNode>): node is PageNode | SceneNode {
  return !!node && !isFigmaDocument(node);
}

/**
 * Resolves Figma pages and layers by their ids.
 * @param ids - The ids of the Figma nodes.
 * @returns The found Figma nodes.
 */
async function resolveNodes(ids: string[]): Promise<(PageNode | SceneNode)[]> {
  const nodes = await Promise.all(ids.map((id) => figma.getNodeByIdAsync(id)));
  return nodes.filter(isPageOrSceneNode);
}

/**
 * Resolves the page that contains the Figma node.
 * @param node - The Figma node to resolve the page for.
 * @returns The page if found, otherwise null.
 */
function resolvePage(node: BaseNode): WithNull<PageNode> {
  let current: WithNull<BaseNode> = node;
  while (current && !isFigmaPage(current)) {
    current = current.parent;
  }
  return current;
}

/**
 * Describes Figma pages and layers with their children down to a depth.
 * @param nodes - The Figma nodes to describe.
 * @param depth - The depth of children to describe.
 * @returns An array of node data.
 */
function describeNodes(nodes: (PageNode | SceneNode)[], depth: number = 0): Promise<AgentNodeData[]> {
  const index = indexPage();
  return Promise.all(nodes.map((node) => describeNode(node, index, depth)));
}

/**
 * Refuses to go on when the current page is not the page of the agent project.
 * @param project - The agent project.
 */
function requireProjectPage({ page }: AgentProjectData): void {
  if (figma.currentPage.name !== page) {
    throw new Error(`Current page is not ${page}`);
  }
}

/**
 * Describes the Figma document and its pages.
 * @returns The document data.
 */
export function describeDocument(): AgentDocumentData {
  const { name, children } = figma.root;
  const pages = children.map((page) => ({ id: page.id, name: page.name }));
  return { name, currentPageId: figma.currentPage.id, pages };
}

/**
 * Selects Figma layers by their ids, switching to their page.
 * @param request - The select request.
 * @returns An array of node data of the selected layers.
 */
export async function selectNodes({ ids }: AgentSelectRequest): Promise<AgentNodeData[]> {
  const nodes = await resolveNodes(ids);
  const layers = nodes.filter(isSceneNode);
  const [first] = layers;
  const page = first ? resolvePage(first) : null;
  if (!page) {
    throw new Error(`Layers not found: ${ids.join(", ")}`);
  }
  await figma.setCurrentPageAsync(page);
  selectFigmaLayers(layers);
  return describeNodes(layers);
}

/**
 * Collects Figma layers whose names contain the substring, stopping at the find limit.
 * @param parent - The Figma node to search in.
 * @param needle - The lowercase name substring.
 * @param found - The array to collect the found layers into.
 */
function collectNodes(parent: BaseNode & ChildrenMixin, needle: string, found: SceneNode[]): void {
  for (const child of parent.children) {
    if (found.length >= FIND_LIMIT) {
      return;
    }
    if (child.name.toLowerCase().includes(needle)) {
      found.push(child);
    }
    if ("children" in child) {
      collectNodes(child, needle, found);
    }
  }
}

/**
 * Finds Figma layers by a name substring inside a root node, or the current page if no root is given.
 * @param request - The find request.
 * @returns An array of node data.
 */
export async function findNodes({ query, rootId }: AgentFindRequest): Promise<AgentNodeData[]> {
  const needle = query.toLowerCase();
  if (!needle) {
    throw new Error("Query is empty");
  }
  const root = rootId ? await figma.getNodeByIdAsync(rootId) : figma.currentPage;
  if (!isPageOrSceneNode(root) || !("children" in root)) {
    throw new Error(`Root not found: ${rootId}`);
  }
  const found: SceneNode[] = [];
  collectNodes(root, needle, found);
  return describeNodes(found);
}

/**
 * Describes Figma pages and layers by their ids with their children, or the current selection if no ids are given.
 * @param request - The inspect request.
 * @returns An array of node data.
 */
export async function inspectNodes({ ids, depth = INSPECT_DEPTH }: AgentInspectRequest): Promise<AgentNodeData[]> {
  const nodes = ids ? await resolveNodes(ids) : [...figma.currentPage.selection];
  return describeNodes(nodes, depth);
}

/**
 * Renders a Figma page or layer to a PNG image.
 * @param request - The capture request.
 * @returns The PNG image bytes.
 */
export async function captureNode({ id, scale = CAPTURE_SCALE }: AgentCaptureRequest): Promise<Uint8Array> {
  const [node] = await resolveNodes([id]);
  if (!node) {
    throw new Error(`Node not found: ${id}`);
  }
  return node.exportAsync({ format: "PNG", constraint: { type: "SCALE", value: scale } });
}

/**
 * Builds a GUI node with its children from a spec inside a parent node.
 * @param spec - The spec of the GUI node.
 * @param parent - The Figma node to build in.
 * @param index - The index of the page.
 * @returns The built layer.
 */
function buildSpec(spec: AgentSpecData, parent: WithNull<BaseNode>, index: AgentIndexData): Promise<SceneNode> {
  if (!isPageOrSceneNode(parent) || !("children" in parent)) {
    throw new Error(`build: no parent to hold ${spec.name}`);
  }
  return buildNode(spec, parent, index);
}

/**
 * Decodes base64 strings to bytes.
 * @param files - The base64 strings by their names.
 * @returns The bytes by the same names.
 */
function decodeFiles(files: Record<string, string>): Record<string, Uint8Array> {
  const entries = Object.entries(files).map(([name, file]) => [name, figma.base64Decode(file)]);
  return Object.fromEntries(entries);
}

/**
 * Adds PNG images as sprites to a group of an atlas.
 * @param atlas - The name of the atlas.
 * @param group - The name of the group.
 * @param files - The base64 PNG images by the names of their sprites.
 * @returns The names of the sprites of the group.
 */
async function importSprites(atlas: string, group: string, files: Record<string, string>): Promise<string[]> {
  const section = findPageAtlasSection(atlas);
  if (!section) {
    throw new Error(`No atlas section ${atlas}`);
  }
  const { children } = await importAtlasSprites(section, group, decodeFiles(files));
  return children.map(convertSpriteName);
}

/**
 * Replaces the picture of a sprite, keeping its instances in place.
 * @param sprite - The name of the sprite with its atlas.
 * @param image - The base64 PNG image.
 * @param index - The index of the page.
 * @returns The instances of the sprite with what was done to each.
 */
function updateSprite(sprite: string, image: string, index: AgentIndexData): Promise<AgentSpriteInstanceData[]> {
  const component = index.sprites[sprite];
  if (!component) {
    throw new Error(`Missing sprite: ${sprite}`);
  }
  return updateAtlasSprite(component, figma.base64Decode(image));
}

/**
 * Exports every GUI root and atlas of the page, the same way they are exported from a selection.
 * @param request - The export request.
 * @returns The serialized bundle data.
 */
export async function exportPage({ project }: AgentExportRequest): Promise<BundleData> {
  requireProjectPage(project);
  const selection = reduceSelectionDataFromLayers([...findPageRoots(), ...findPageAtlases()]);
  const gui = await exportGUI(pickGUIFromSelectionData(selection));
  const atlases = await exportAtlases(reduceAtlasesFromSelectionData(selection));
  return { gui, atlases };
}

/**
 * Collects the library the code of the agent runs with: the updates the plugin UI runs, and what builds GUI nodes and manages atlas sprites on top of them.
 * @param project - The agent project.
 * @returns The library.
 */
function createLibrary({ fonts }: AgentProjectData) {
  const index = indexPage(fonts);
  return {
    sections: findPageSections,
    roots: findPageRoots,
    atlases: findPageAtlases,
    atlasSection: findPageAtlasSection,
    section: ensureSection,
    getData: getPluginData,
    updateGUINode,
    updateSection,
    updateAtlas,
    build: (spec: AgentSpecData, parent: WithNull<BaseNode>) => buildSpec(spec, parent, index),
    find: findNode,
    center: centerNode,
    setFontSize,
    renameNodes,
    importSprites,
    updateSprite: (sprite: string, image: string) => updateSprite(sprite, image, index),
    moveSprites,
    sortAtlases,
  };
}

/**
 * Runs code as an async function body with access to the Figma Plugin API, the library, the agent project and the arguments.
 * @param request - The run request.
 * @returns The value returned by the code.
 */
export async function runCode({ code, args = {}, project }: AgentRunRequest): Promise<unknown> {
  requireProjectPage(project);
  const run = new Function("figma", "L", "PROJECT", "ARGS", `return (async () => {\n${code}\n})();`);
  return run(figma, createLibrary(project), project, args);
}
