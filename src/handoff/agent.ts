/**
 * Provides endpoints for the agent mode, allowing an external agent to find, inspect, select, and capture Figma layers, and to run code against the Figma Plugin API.
 * @packageDocumentation
 */

import { getPluginData, isFigmaDocument, isFigmaPage, isLayerData, selectFigmaLayers } from "utilities/figma";

const FIND_LIMIT = 200;
const CAPTURE_SCALE = 1;

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
 * Resolves the geometry of a Figma node. Pages have no geometry.
 * @param node - The Figma node to resolve the geometry for.
 * @returns The geometry of the Figma node.
 */
function resolveNodeGeometry(node: PageNode | SceneNode): Partial<AgentNodeData> {
  if (isFigmaPage(node)) {
    return {};
  }
  return { x: node.x, y: node.y, width: node.width, height: node.height, visible: node.visible };
}

/**
 * Serializes a Figma node with its bound GUI node data.
 * @param node - The Figma node to serialize.
 * @param depth - The depth of children to serialize.
 * @returns The serialized node data.
 */
function serializeNode(node: PageNode | SceneNode, depth: number): AgentNodeData {
  const data: AgentNodeData = {
    id: node.id,
    name: node.name,
    type: node.type,
    ...resolveNodeGeometry(node),
    guiNode: isLayerData(node) ? getPluginData(node, "defoldGUINode") : null,
  };
  if (depth > 0 && "children" in node) {
    data.children = node.children.map((child) => serializeNode(child, depth - 1));
  }
  return data;
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
 * @returns An array of serialized data of the selected layers.
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
  return layers.map((layer) => serializeNode(layer, 0));
}

/**
 * Serializes Figma pages and layers by their ids, or the current selection if no ids are given.
 * @param request - The inspect request.
 * @returns An array of serialized node data.
 */
export async function inspectNodes({ ids, depth = 1 }: AgentInspectRequest): Promise<AgentNodeData[]> {
  const nodes = ids ? await resolveNodes(ids) : [...figma.currentPage.selection];
  return nodes.map((node) => serializeNode(node, depth));
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
 * @returns An array of serialized layer data.
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
  return found.map((node) => serializeNode(node, 0));
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
 * Runs code as an async function body with access to the Figma Plugin API.
 * @param request - The run request.
 * @returns The value returned by the code.
 */
export async function runCode({ code }: AgentRunRequest): Promise<unknown> {
  const run = new Function("figma", `return (async () => {\n${code}\n})();`);
  return run(figma);
}
