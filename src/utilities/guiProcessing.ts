/**
 * Handles GUI-related data processing and transformation.
 * @packageDocumentation
 */

import config from "config/config.json";
import { isGUIBoxType, isGUIReplacedBySpine, isGUIReplacedByTemplate } from "utilities/gui";
import { inferGUINode } from "utilities/inference";
import { addVectors, areVectorsEqual, copyVector, vector4, flipVector } from "utilities/math";
import { calculateChildPosition } from "utilities/pivot";
import { tryRestoreSlice9LayerData } from "utilities/slice9";
import { resolveDefaultRootSpineBone } from "utilities/spine";

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
  adjustGUINodeTypes(collapsedNodes);
  const flatNodes = flattenGUINodes(collapsedNodes);
  const impliedNodes = tryGenerateImpliedNodes(flatNodes)
  gui.nodes = [...flatNodes, ...impliedNodes ];
  return gui;
}

function tryGenerateImpliedNodes(nodes: GUINodeData[]) {
  const impliedNodes = nodes.reduce<GUINodeData[]>(tryGenerateImpliedNode, []);
  return impliedNodes;
}

function tryGenerateImpliedNode(impliedNodes: GUINodeData[], node: GUINodeData) {
  if (shouldGenerateWrapperNode(node)) {
    const wrapperNode = generateWrapperNode(node);
    impliedNodes.push(wrapperNode);
  }
  return impliedNodes;
}

function shouldGenerateWrapperNode(node: GUINodeData) {
  return node.wrapper;
}

function generateWrapperNode(node: GUINodeData) {
  const wrapperID = `${node.id}_wrapper`;
  const wrapperSize = resolveWrapperSize(node);
  const { wrapper_padding: { x, y, z, w } } = node;
  const shiftX = (x - z) / 2;
  const shiftY = (w - y) / 2;
  const nodeShift = vector4(shiftX, shiftY, 0, 0);
  const wrapperShift = flipVector(nodeShift);
  const wrapperPosition = addVectors(node.position, wrapperShift)
  const wrapperNode: GUINodeData = {
    ...config.guiNodeDefaultValues,
    ...config.guiNodeDefaultSpecialValues,
    id: wrapperID,
    type: "TYPE_BOX",
    parent: node.parent,
    size: wrapperSize,
    position: wrapperPosition,
    rotation: node.rotation,
    scale: node.scale,
    pivot: node.pivot,
    size_mode: "SIZE_MODE_MANUAL",
    visible: false,
  }
  node.parent = wrapperID;
  node.position = nodeShift;
  node.rotation = vector4(0);
  node.scale = vector4(1);
  node.pivot = "PIVOT_CENTER";
  return wrapperNode;
}

function resolveWrapperSize(node: GUINodeData) {
  const { size, wrapper_padding: padding } = node;
  const width = size.x + padding.x + padding.z;
  const height = size.y + padding.y + padding.w;
  return vector4(width, height, 0, 0);
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
  parent.exportable_layer = child.exportable_layer
  parent.exportable_layer_id = child.exportable_layer_id
  parent.exportable_layer_name = child.exportable_layer_name
  if (child.children) {
    if (!parent.children) {
      parent.children = [];
    }
    for (let index = 0; index < child.children.length; index++) {
      const collapsedChild = child.children[index];
      if (parent.pivot != child.pivot) {
        const { exportable_layer: layer } = collapsedChild;
        if (layer) {
          const { pivot, size } = collapsedChild;
          const { pivot: parentPivot, size: parentSize } = parent;
          const parentShift = vector4(0);
          collapsedChild.position = calculateChildPosition(layer, pivot, parentPivot, size, parentSize, parentShift);
        }
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

function adjustGUINodeTypes(nodes: GUINodeData[]) {
  nodes.forEach(adjustGUINodeType)
}

function adjustGUINodeType(node: GUINodeData) {
  if (isGUIBoxType(node.type)) {
    if (isGUIReplacedByTemplate(node)) {
      node.type = "TYPE_TEMPLATE";
    } else if (isGUIReplacedBySpine(node)) {
      node.type = "TYPE_CUSTOM";
    }
  }
  if (node.children) {
    node.children.forEach(adjustGUINodeType);
  }
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

export async function postProcessGUISpineAttachmentsData(spine: SpineData): Promise<SpineData> {
  const { bones, slots, skins } = spine;
  const rootBone = filterRootSpineBone(bones);
  const rootedBoneCoordinates = collapseBoneCoordinates(bones);
  moveAttachmentsToRoot(skins, slots, rootBone, rootedBoneCoordinates);
  return { ...spine, bones: rootBone };
}

function filterRootSpineBone(bones: SpineBoneData[]) {
  const rootBone = bones.find((bone) => !bone.parent);
  if (!rootBone) {
    const bone = resolveDefaultRootSpineBone();
    return [bone]
  }
  return [rootBone];
}

function collapseBoneCoordinates(originalBones: SpineBoneData[]) {
  const boneDepths = originalBones.reduce((depth, bone) => {
    const { name } = bone;
    let { parent } = bone;
    let boneDepth = 0;
    while (parent) {
      boneDepth += 1;
      parent = originalBones.find((bone) => bone.name === parent)?.parent;
    }
    depth[name] = boneDepth;
    return depth;
  }, {} as Record<string, number>)
  const sortedBones = originalBones.slice().sort((bone1, bone2) => {
    const depthBone1 = boneDepths[bone1.name];
    const depthBone2 = boneDepths[bone2.name];
    return depthBone1 - depthBone2; 
  })
  const originalBoneCoordinates = originalBones.reduce((coordinates, bone) => {
    const { name, x, y } = bone;
    const boneX = x ?? 0;
    const boneY = y ?? 0;
    coordinates[name] = vector4(boneX, boneY, 0, 0);
    return coordinates;
  }, {} as Record<string, Vector4>);
  const collapsedBoneCoordinates = sortedBones.reduce((coordinates, bone) => {
    const { name } = bone;
    const { parent } = bone;
    const boneCoordinates = originalBoneCoordinates[name];
    if (parent) {
      const parentCoordinates = originalBoneCoordinates[parent];
      boneCoordinates.x += parentCoordinates.x;
      boneCoordinates.y += parentCoordinates.y;
    }
    coordinates[name] = boneCoordinates;
    return coordinates;
  }, {} as Record<string, Vector4>);
  return collapsedBoneCoordinates;
}

function moveAttachmentsToRoot(skins: SpineSkinData[], slots: SpineSlotData[], collapsedBones: SpineBoneData[], rootedBoneCoordinates: Record<string, Vector4>) {
  const [ rootBone ] = collapsedBones;
  const [ { attachments } ] = skins;
  return slots.forEach((slot) => {
    const { bone, name, attachment: attachmentName } = slot;
    const boneCoordinates = rootedBoneCoordinates[bone];
    const attachment = attachments[name][attachmentName]
    slot.bone = rootBone.name;
    if (attachment.type === "mesh") {
      if (attachment.vertices) {
        for (let index = 0; index < attachment.vertices.length; index += 2) {
          attachment.vertices[index] += boneCoordinates.x;
          attachment.vertices[index + 1] += boneCoordinates.y;
        }
      }
    } else {
      attachment.x = attachment.x ? attachment.x + boneCoordinates.x : boneCoordinates.x;
      attachment.y = attachment.y ? attachment.y + boneCoordinates.y : boneCoordinates.y;
    }
  });
}

export async function postProcessGUIPSDData(psdData: PSDData): Promise<PSDData> {
  const { layers } = psdData;
  const flatLayers = flattenCenterPSDLayers(layers);
  return { ...psdData, layers: flatLayers }
}

function flattenCenterPSDLayers(layers: PSDLayerData[]): PSDLayerData[] {
  return layers;
}
