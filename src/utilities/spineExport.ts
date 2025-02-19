/**
 * 
 * @packageDocumentation
 */

import { hasGUITexture } from "utilities/gui";
import { isZeroVector } from "utilities/math";
import { convertSpineBoneName, convertSpineBoneTransformations, convertSpineSkinImageAttachmentPosition, convertSpineSkinImageAttachmentScale, convertSpineSkinImageAttachmentSize, convertSpineSkinMeshAttachmentGeometry, convertSpineSkinMeshAttachmentHull, convertSpineSlotAttachment, convertSpineSlotName } from "utilities/spineConversion";

export function generateSpineBoneData(nodes: GUINodeData[]) {
  const bones = nodes.map(convertSpineBoneData);
  return bones;
}

function convertSpineBoneData(node: GUINodeData) {
  const { parent } = node;
  const name = convertSpineBoneName(node);
  const spineBoneTransformations = convertSpineBoneTransformations(node);
  const data: SpineBoneData = {
    name,
    ...spineBoneTransformations,
  };
  if (parent) {
    data.parent = parent;
  }
  return data;
}

export function generateSpineSlotData(nodes: GUINodeData[]) {
  const slots = nodes.reduce(spineSlotDataReducer, []);
  return slots;
}

function spineSlotDataReducer(slots: SpineSlotData[], node: GUINodeData) {
  if (hasGUITexture(node)) {
    const name = convertSpineSlotName(node);
    const attachment = convertSpineSlotAttachment(node);
    const data = {
      name,
      bone: name,
      attachment
    };
    slots.push(data);
  }
  return slots;
}

export function generateSpineSkinData(nodes: GUINodeData[]) {
  const attachments = nodes.reduce(spineSkinAttachmentDataReducer, {});
  const skins = [{ name: "default", attachments }];
  return skins;
}

function spineSkinAttachmentDataReducer(attachments: Record<string, Record<string, SpineAttachmentData>>, node: GUINodeData) {
  if (hasGUITexture(node)) {
    const { id: name } = node;
    if (shouldGenerateSpineSkinImageAttachment(node)) {
      attachments[name] = generateSpineSkinImageAttachment(node);
    } else {
      attachments[name] = generateSpineSkinMeshAttachment(node);
    }
  }
  return attachments;
}

function shouldGenerateSpineSkinImageAttachment(node: GUINodeData) {
  const { slice9 } = node
  return !slice9 || isZeroVector(slice9);
}

function generateSpineSkinImageAttachment(node: GUINodeData & { texture: string, texture_size: Vector4 }) {
  const path = convertSpineSlotAttachment(node);
  const { x: width, y: height } = convertSpineSkinImageAttachmentSize(node)
  const { x, y, } = convertSpineSkinImageAttachmentPosition(node);
  const { x: scaleX, y: scaleY } = convertSpineSkinImageAttachmentScale(node);
  const attachment: SpineAttachmentData = {
    path,
    width,
    height,
    x,
    y,
    scaleX,
    scaleY
  };
  return { [path]: attachment };
}

function generateSpineSkinMeshAttachment(node: GUINodeData & { texture: string, texture_size: Vector4 }) {
  const { texture_size: { x: width, y: height } } = node;
  const type: SpineAttachmentType = "mesh";
  const path = convertSpineSlotAttachment(node);
  const geometry = convertSpineSkinMeshAttachmentGeometry(node);
  const hull = convertSpineSkinMeshAttachmentHull(node);
  const attachment: SpineAttachmentData = {
    path,
    type,
    width,
    height,
    ...geometry,
    hull,
  };
  return { [path]: attachment };
}
