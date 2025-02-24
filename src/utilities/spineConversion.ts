/**
 * 
 * @packageDocumentation
 */

import { PROJECT_CONFIG } from "handoff/project";
import { calculateTextSpriteAdjustment, isFigmaText } from "utilities/figma";
import { addVectors, flipVector, flipVectorY, isZeroVector, subVectors, vector4 } from "utilities/math";
import { isPivotEast, isPivotNorth, isPivotSouth, isPivotWest } from "utilities/pivot";

export function convertSpineBoneName(node: GUINodeData) {
  return node.id;
}

export function convertSpineBoneTransformations(node: GUINodeData) {
  const { position: startPosition } = node
  const onScreenShift = calculateSpineBonePositionOnScreenShift(node);
  const { x, y } = addVectors(startPosition, onScreenShift);
  const data = {
    x,
    y,
  }
  return data;
}

function calculateSpineBonePositionOnScreenShift(node: GUINodeData) {
  if (node.screen) {
    const { position } = node;
    const padding = subVectors(PROJECT_CONFIG.screenSize, position);
    const adjustment = flipVector(PROJECT_CONFIG.screenSize);
    const shift = addVectors(adjustment, padding);
    return shift;
  }
  return vector4(0);
}

export function convertSpineSlotName(node: GUINodeData) {
  return node.id;
}

export function convertSpineSlotAttachment(node: GUINodeData & { texture: string }) {
  const { texture } = node;
  const textureName = texture.split("/").pop();
  const attachment = textureName ?? texture;
  return attachment;
}

export function convertSpineSkinImageAttachmentSize(node: GUINodeData & { texture: string, texture_size: Vector4 }) {
  const { texture_size: { x, y } } = node;
  return vector4(x, y, 0, 0);
}

export function convertSpineSkinImageAttachmentPosition(node: GUINodeData & { texture: string, texture_size: Vector4, exportable_layer: ExportableLayer }) {
  const pivotShift = calculateSpineSkinImageAttachmentPivotShift(node);
  const adjustmentShift = calculateSpineSkinImageAttachmentAdjustmentShift(node);
  const position = addVectors(pivotShift, adjustmentShift);
  return position;
}

function calculateSpineSkinImageAttachmentPivotShift(node: GUINodeData & { texture: string, texture_size: Vector4 }) {
  const { pivot, texture_size: { x: width, y: height } } = node;
  const position = vector4(0);
  if (isPivotNorth(pivot)) {
    position.y = height / 2;
  } else if (isPivotSouth(pivot)) {
    position.y = height / -2;
  }
  if (isPivotEast(pivot)) {
    position.x = width / -2;
  } else if (isPivotWest(pivot)) {
    position.x = width / 2;
  }
  return position;
}

function calculateSpineSkinImageAttachmentAdjustmentShift(node: GUINodeData & { texture: string, texture_size: Vector4, exportable_layer: ExportableLayer }) {
  const { exportable_layer: layer } = node;
  if (isFigmaText(layer)) {
    const adjustmentShift = calculateTextSpriteAdjustment(layer);
    return flipVectorY(adjustmentShift); 
  }
  return vector4(0);
}

export function convertSpineSkinImageAttachmentScale(node: GUINodeData & { texture: string, texture_size: Vector4, exportable_layer: ExportableLayer }) {
  if (shouldCalculateSpineSkinImageAttachmentScale(node)) {
    return calculateSpineSkinImageAttachmentScale(node)
  }
  return vector4(1);
}

function shouldCalculateSpineSkinImageAttachmentScale(node: GUINodeData & { exportable_layer: ExportableLayer }) {
  const { exportable_layer: layer, slice9 } = node;
  return !isFigmaText(layer) && (!slice9 || isZeroVector(slice9))
}

function calculateSpineSkinImageAttachmentScale(node: GUINodeData & { texture: string, texture_size: Vector4 }) {
  const { size, texture_size: textureSize } = node;
  const { x: width, y: height } = size;
  const { x: textureWidth, y: textureHeight } = textureSize;
  const x = width / textureWidth;
  const y = height / textureHeight;
  const scale = Math.min(x, y);
  return vector4(scale, scale, 0, 0);
}

export function convertSpineSkinMeshAttachmentGeometry(node: GUINodeData & { texture_size: Vector4 }) {
  const { size: { x: width, y: height }, texture_size: { x: textureWidth, y: textureHeight }, slice9 } = node;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const baseVertices = resolveBaseVertices(halfWidth, halfHeight);
  const baseUVs = resolveBaseUVs();
  const groupedVertices: number[][] = []
  const groupedUVs: number[][] = []
  for (let index = 0; index < 4; index += 1) {
    groupedVertices.push(baseVertices[index])
    groupedUVs.push(baseUVs[index])
    tryConvertMiddleVerticesAndUVs(index, slice9, halfWidth, halfHeight, textureWidth, textureHeight, groupedVertices, groupedUVs)
  }
  tryConvertInsideVerticesAndUVs(slice9, halfWidth, halfHeight, textureWidth, textureHeight, groupedVertices, groupedUVs)
  const polygons = findPolygons(width, height, slice9);
  const triangles = convertTriangles(polygons, groupedVertices);
  const edges = convertEdges(polygons, groupedVertices);
  const vertices = groupedVertices.flat();
  const uvs = groupedUVs.flat();
  return {
    vertices,
    uvs,
    triangles,
    edges,
  }
}

function resolveBaseVertices(halfWidth: number, halfHeight: number) {
  return [
    [-halfWidth, -halfHeight],
    [halfWidth, -halfHeight],
    [halfWidth, halfHeight],
    [-halfWidth, halfHeight],
  ];
}

function resolveBaseUVs() {
  return [
    [0, 1],
    [1, 1],
    [1, 0],
    [0, 0],
  ];
}

function tryConvertMiddleVerticesAndUVs(index: number, slice9: Vector4, halfWidth: number, halfHeight: number, textureWidth: number, textureHeight: number, vertices: number[][], uvs: number[][]) {
  if (index == 0) {
    if (slice9.x > 0) {
      const vertex = [-halfWidth + slice9.x, -halfHeight];
      vertices.push(vertex)
      const uv = [slice9.x / textureWidth, 1];
      uvs.push(uv)
    }
    if (slice9.z > 0) {
      const vertex = [halfWidth - slice9.z, -halfHeight];
      vertices.push(vertex)
      const uv = [(textureWidth - slice9.z) / textureWidth, 1];
      uvs.push(uv)
    }
  } else if (index == 1) {
    if (slice9.y > 0) {
      const vertex = [halfWidth, -halfHeight + slice9.y];
      vertices.push(vertex)
      const uv = [1, (textureHeight - slice9.y) / textureHeight];
      uvs.push(uv)
    }
    if (slice9.w > 0) {
      const vertex = [halfWidth, halfHeight - slice9.w];
      vertices.push(vertex)
      const uv = [1, slice9.w / textureHeight];
      uvs.push(uv)
    }
  } else if (index == 2) {
    if (slice9.z > 0) {
      const vertex = [halfWidth - slice9.z, halfHeight];
      vertices.push(vertex)
      const uv = [(textureWidth - slice9.z) / textureWidth, 0];
      uvs.push(uv)
    }
    if (slice9.x > 0) {
      const vertex = [-halfWidth + slice9.x, halfHeight];
      vertices.push(vertex)
      const uv = [slice9.x / textureWidth, 0];
      uvs.push(uv)
    }
  } else if (index == 3) {
    if (slice9.w > 0) {
      const vertex = [-halfWidth, halfHeight - slice9.w];
      vertices.push(vertex)
      const uv = [0, slice9.w / textureHeight];
      uvs.push(uv)
    }
    if (slice9.y > 0) {
      const vertex = [-halfWidth, -halfHeight + slice9.y];
      vertices.push(vertex)
      const uv = [0, (textureHeight - slice9.y) / textureHeight];
      uvs.push(uv)
    }
  }
}

function tryConvertInsideVerticesAndUVs(slice9: Vector4, halfWidth: number, halfHeight: number, textureWidth: number, textureHeight: number, vertices: number[][], uvs: number[][]) {
  if (slice9.x > 0) {
    if (slice9.y > 0) {
      const vertex = [-halfWidth + slice9.x, -halfHeight + slice9.y];
      vertices.push(vertex);
      const uv = [slice9.x / textureWidth, (textureHeight - slice9.y) / textureHeight];
      uvs.push(uv)
    }
    if (slice9.w > 0) {
      const vertex = [-halfWidth + slice9.x, halfHeight - slice9.w];
      vertices.push(vertex);
      const uv = [slice9.x / textureWidth, slice9.w / textureHeight];
      uvs.push(uv)
    }
  }
  if (slice9.z > 0) {
    if (slice9.y > 0) {
      const vertex = [halfWidth - slice9.z, -halfHeight + slice9.y];
      vertices.push(vertex);
      const uv = [(textureWidth - slice9.z) / textureWidth, (textureHeight - slice9.y) / textureHeight];
      uvs.push(uv)
    }
    if (slice9.w > 0) {
      const vertex = [halfWidth - slice9.z, halfHeight - slice9.w];
      vertices.push(vertex);
      const uv = [(textureWidth - slice9.z) / textureWidth, slice9.w / textureHeight];
      uvs.push(uv)
    }
  }
}

function findPolygons(width: number, height: number, slice9: Vector4) {
  const x1 = -width / 2;
  const y1 = -height / 2;
  const x2 = width / 2;
  const y2 = height / 2;
  const left = x1 + slice9.x;
  const top = y1 + slice9.y;
  const right = x2 - slice9.z;
  const bottom = y2 - slice9.w;
  const slices = [
    [x1, y1, left, top],
    [left, y1, right, top],
    [right, y1, x2, top],
    [x1, top, left, bottom],
    [left, top, right, bottom],
    [right, top, x2, bottom],
    [x1, bottom, left, y2],
    [left, bottom, right, y2],
    [right, bottom, x2, y2],
  ];
  return slices.reduce<number[][]>((cumulative, slice) => {
    if (slice[0] === slice[2] || slice[1] === slice[3]) {
      return cumulative;
    }
    return [...cumulative, slice];
  }, [])
}

function convertTriangles(polygons: number[][], vertices: number[][]) {
  const trianglePoints = convertTrianglePoints(polygons);
  const triangles = convertTrianglePointsToIndices(trianglePoints, vertices);
  return triangles.flat();
}

function convertTrianglePoints(polygons: number[][]) {
  const triangles = polygons.reduce<number[][]>((cumulative, polygon) => {
    const point1 = [polygon[0], polygon[1]];
    const point2 = [polygon[2], polygon[1]];
    const point3 = [polygon[2], polygon[3]];
    const point4 = [polygon[0], polygon[3]];
    const triangle1 = [...point1, ...point2, ...point3];
    const triangle2 = [...point3, ...point4, ...point1];
    return [...cumulative, triangle1, triangle2];
  }, [])
  return triangles;
}

function convertTrianglePointsToIndices(trianglePoints: number[][], vertices: number[][]) {
  return trianglePoints.map((triangle) => {
    const triangleIndices = [];
    for (let index = 0; index < triangle.length; index += 2) {
      const vertex = triangle.slice(index, index + 2);
      const vertexIndex = vertices.findIndex((vertexData) => vertexData[0] === vertex[0] && vertexData[1] === vertex[1]);
      triangleIndices.push(vertexIndex);
    }
    return triangleIndices;
  });
}

function convertEdges(polygons: number[][], vertices: number[][]) {
  const edgePoints = convertEdgePoints(polygons);
  const edges = convertEdgePointsToIndices(edgePoints, vertices);
  return edges.flat();
}

function convertEdgePoints(polygons: number[][]) {
  const edgePoints = polygons.reduce<number[][]>((cumulative, polygon) => {
    const polygonEdge1 = [polygon[0], polygon[1], polygon[2], polygon[1]];
    const polygonEdge2 = [polygon[2], polygon[1], polygon[2], polygon[3]];
    const polygonEdge3 = [polygon[2], polygon[3], polygon[0], polygon[3]];
    const polygonEdge4 = [polygon[0], polygon[3], polygon[0], polygon[1]];
    if (cumulative.every(edge => edge[0] !== polygonEdge1[0] || edge[1] !== polygonEdge1[1] || edge[2] !== polygonEdge1[2] || edge[3] !== polygonEdge1[3])) {
      cumulative.push(polygonEdge1);
    }
    if (cumulative.every(edge => edge[0] !== polygonEdge2[0] || edge[1] !== polygonEdge2[1] || edge[2] !== polygonEdge2[2] || edge[3] !== polygonEdge2[3])) {
      cumulative.push(polygonEdge2);
    }
    if (cumulative.every(edge => edge[0] !== polygonEdge3[0] || edge[1] !== polygonEdge3[1] || edge[2] !== polygonEdge3[2] || edge[3] !== polygonEdge3[3])) {
      cumulative.push(polygonEdge3);
    }
    if (cumulative.every(edge => edge[0] !== polygonEdge4[0] || edge[1] !== polygonEdge4[1] || edge[2] !== polygonEdge4[2] || edge[3] !== polygonEdge4[3])) {
      cumulative.push(polygonEdge4);
    }
    return cumulative;
  }, [])
  return edgePoints;
}

function convertEdgePointsToIndices(edgePoints: number[][], vertices: number[][]) {
  return edgePoints.map((edge) => {
    const edgeIndices = [];
    for (let index = 0; index < edge.length; index += 2) {
      const vertex = edge.slice(index, index + 2);
      const vertexIndex = vertices.findIndex((vertexData) => vertexData[0] === vertex[0] && vertexData[1] === vertex[1]);
      edgeIndices.push(vertexIndex * 2);
    }
    return edgeIndices;
  });
}

export function convertSpineSkinMeshAttachmentHull(node: GUINodeData) {
  const { slice9 } = node;
  const additionalVertices = Object.values(slice9).reduce((cumulative, value) => cumulative + (value > 0 ? 2 : 0), 0);
  return 4 + additionalVertices
}
