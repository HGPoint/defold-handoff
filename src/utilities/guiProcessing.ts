/**
 * Handles GUI-related data processing and transformation.
 * @packageDocumentation
 */

import { inferGUINode } from "utilities/inference";
import { areVectorsEqual, copyVector, vector4 } from "utilities/math";
import { calculateChildPosition } from "utilities/pivot";
import { tryRestoreSlice9LayerData } from "utilities/slice9";

/**
 * Prepares the GUI node layer before export.
 * @param data - The GUI export pipeline data.
 * @returns The GUI export pipeline data.
 */
export async function preprocessGUIData(data: GUIExportPipelineData): Promise<GUIExportPipelineData> {
  const { layer } = data;
  await inferGUINode(layer);
  await tryRestoreSlice9LayerData(layer, "defoldGUINode");
  return data;
}

/**
 * Postprocesses the GUI data after export.
 * @param gui - The GUI data to postprocess.
 * @returns The postprocessed GUI data.
 */
export async function postprocessGUIData(gui: GUIData): Promise<GUIData> {
  const { nodes } = gui;
  const collapsedNodes = collapseGUINodes(nodes);
  sanitizeGUINodeIDs(collapsedNodes);
  const flatNodes = flattenGUINodes(collapsedNodes);
  gui.nodes = flatNodes;
  return gui;
}

/**
 * Recursively collapses GUI nodes by merging collapsible child nodes into their parent nodes.
 * @param nodes - The GUI nodes to collapse.
 * @returns The collapsed GUI nodes.
 */
function collapseGUINodes(nodes: GUINodeData[]): GUINodeData[] {
  return nodes.map(collapseGUINode);
}

/**
 * Recursively collapses GUI node by merging collapsible child nodes into their parent nodes.
 * @param nodes - The GUI node to collapse.
 * @returns The collapsed GUI node.
 */
function collapseGUINode(node: GUINodeData) {
  if (!node.children || node.children.length === 0) {
    return node;
  }
  node.children = node.children.map(collapseGUINode);
  for (let index = 0; index < node.children.length; index++) {
    const child = node.children[index];
    if (canCollapseWithParent(node, child)) {
      node.children.splice(index, 1);
      collapseWithParent(node, child, index);
      break;
    }
  }
  return node;
}

/**
 * Determines whether the child node can be collapsed into the parent node.
 * @param parent - The parent GUI node.
 * @param child - The child GUI node.
 * @returns True if the child node can be collapsed into the parent, otherwise false.
 */
function canCollapseWithParent(parent: GUINodeData, child: GUINodeData): boolean {
  return (
    !child.fixed &&
    areVectorsEqual(parent.size, child.size) &&
    parent.type === child.type &&
    !parent.texture &&
    (
      (child.visible && !!child.texture) ||
      !child.visible
    )
  );
}

/**
 * Collapses a child GUI node into the parent GUI node.
 * @param parent - The parent GUI node.
 * @param child - The child GUI node.
 * @param childIndex - The index of the child node.
 */
function collapseWithParent(parent: GUINodeData, child: GUINodeData, childIndex: number) {
  parent.visible = child.visible;
  parent.texture = child.texture;
  parent.texture_size = child.texture_size && copyVector(child.texture_size);
  parent.color = child.color;
  parent.size_mode = child.size_mode;
  parent.slice9 = copyVector(child.slice9);
  parent.material = child.material;
  parent.adjust_mode = child.adjust_mode;
  parent.blend_mode = child.blend_mode;
  if (child.children) {
    if (!parent.children) {
      parent.children = [];
    }
    for (let index = 0; index < child.children.length; index++) {
      const collapsedChild = child.children[index];
      if (parent.pivot != child.pivot) {
        const layer = collapsedChild.exportable_layer;
        const { pivot, size } = collapsedChild;
        const { pivot: parentPivot, size: parentSize } = parent;
        const parentShift = vector4(0);
        collapsedChild.position = calculateChildPosition(layer, pivot, parentPivot, size, parentSize, parentShift);
      }
      collapsedChild.parent = parent.id;
      parent.children.splice(childIndex, childIndex + index, collapsedChild);
    }
  }
}

function sanitizeGUINodeIDs(nodes: GUINodeData[]) {
  nodes.forEach((node) => { sanitizeGUINode(node) });
}

function sanitizeGUINode(node: GUINodeData, newParentID: string = "", usedIDs: string[] = []) {
  const { id } = node;
  let newNodeID: string;
  if (newParentID) {
    node.parent = newParentID;
  }
  if (usedIDs.includes(id)) {
    let nodeIndex = 1;
    newNodeID = resolveGUINodeID(id, nodeIndex);
    while (usedIDs.includes(newNodeID)) {
      nodeIndex += 1;
      newNodeID = resolveGUINodeID(id, nodeIndex);
    }
    node.id = newNodeID;
  }
  usedIDs.push(node.id);
  if (node.children) {
    node.children.forEach((child) => sanitizeGUINode(child, newNodeID, usedIDs));
  }
}

function resolveGUINodeID(originalID: string, index: number): string {
  return `${originalID}_${index}`;
}

/**
 * Flattens the GUI nodes data.
 * @param nodes - The GUI nodes data.
 * @returns The flattened GUI nodes data.
 */
function flattenGUINodes(nodes: GUINodeData[]): GUINodeData[] {
  const processedNodes = [];
  for (const node of nodes) {
    processedNodes.push(node);
    if (node.children && node.children.length > 0) {
      processedNodes.push(...flattenGUINodes(node.children));
    }
  }
  return processedNodes;
}
