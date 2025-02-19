/**
 * 
 * @packageDocumentation
 */

import { calculateTextSpriteAdjustment, isFigmaText } from "utilities/figma";
import { hasGUITexture } from "utilities/gui";
import { addVectors, flipVectorY, multiplyVectorByValue, vector4 } from "utilities/math";
import { isPivotEast, isPivotNorth, isPivotSouth, isPivotWest } from "utilities/pivot";
import { resolvePSDLayerSize } from "utilities/psd";

export function convertPSDLayerName(node: GUINodeData): string {
  return node.id;
}

export function convertPSDLayerPosition(node: GUINodeData, nodes: GUINodeData[], canvasSize: Vector4): Vector4 {
  if (hasGUITexture(node)) {
    return calculatePSDLayerPosition(node, nodes, canvasSize);
  }
  return node.position;
}

function calculatePSDLayerPosition(node: GUINodeData, nodes: GUINodeData[], canvasSize: Vector4): Vector4 {
  const { position } = node;
  const startPosition = flipVectorY(position)
  const size = resolvePSDLayerSize(node);
  const sizeShift = calculatePSDLayerSizeShift(size);
  const canvasShift = calculatePSDLayerCanvasShift(canvasSize);
  const parentShift = calculatePSDLayerPositionParentShift(node, nodes);
  const pivotShift = calculatePSDLayerPositionPivotShift(node, size);
  const adjustmentShift = calculatePSDLayerPositionAdjustmentShift(node);
  const psdLayerPosition = addVectors(startPosition, sizeShift, canvasShift, parentShift, pivotShift, adjustmentShift);
  return psdLayerPosition;
}

function calculatePSDLayerSizeShift(size: Vector4) {
  const shift = multiplyVectorByValue(size, -0.5)
  return shift;
}

function calculatePSDLayerCanvasShift(canvasSize: Vector4) {
  const shift = multiplyVectorByValue(canvasSize, 0.5)
  return shift;
}

function calculatePSDLayerPositionParentShift(node: GUINodeData, nodes: GUINodeData[]) {
  let { parent } = node;
  const parentShift = vector4(0);
  while (parent) {
    const parentNode = nodes.find(node => node.id === parent)
    if (parentNode) {
      const { position: { x, y } } = parentNode;
      parentShift.x += x;
      parentShift.y += -y;
      ({ parent } = parentNode);
    }
  }
  return parentShift;
}

function calculatePSDLayerPositionPivotShift(node: GUINodeData, size: Vector4): Vector4 {
  const shift = vector4(0);
  const { pivot } = node;
  const { x: width, y: height } = size
  if (isPivotNorth(pivot)) {
    shift.y = height / -2;
  } else if (isPivotSouth(pivot)) {
    shift.y = height / 2;
  }
  if (isPivotEast(pivot)) {
    shift.x = width / -2;
  } else if (isPivotWest(pivot)) {
    shift.x = width / 2;
  }
  return shift;
}

function calculatePSDLayerPositionAdjustmentShift(node: GUINodeData) {
  const { exportable_layer: layer } = node;
  if (isFigmaText(layer)) {
    return calculateTextSpriteAdjustment(layer);
  }
  return vector4(0);
}
