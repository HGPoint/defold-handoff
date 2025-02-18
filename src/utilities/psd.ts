import { findSlice9PlaceholderLayer } from "utilities/slice9";
import { isFigmaText, hasAbsoluteRenderBounds, hasAbsoluteBoundingBox, isFigmaBox } from "utilities/figma";
import { vector4, isZeroVector } from "utilities/math";
import { isPivotEast, isPivotNorth, isPivotSouth, isPivotWest } from "utilities/pivot";

export const PSD_SERIALIZATION_PIPELINE: TransformPipeline<PSDData, SerializedPSDData> = {
  transform: serializePSDData,
};

export function resolvePSDFilePath() {
  return "";
}

export function generatePSDLayerData(nodes: GUINodeData[]) {
  const slots = nodes.reduce(reducePSDLayerData, []);
  return slots;
}

function reducePSDLayerData(layers: PSDLayerData[], node: GUINodeData, index: number, nodes: GUINodeData[]) {
  if (node.texture) {
    const { id: name } = node;
    const layer = resolvePSDLayerFigmaLayer(node);
    const { x: left, y: top } = resolvePSDLayerPosition(node, nodes)
    const psdLayer: PSDLayerData = {
      name,
      layer,
      left,
      top,
    };
    layers.push(psdLayer);
  }
  return layers;
}

function resolvePSDLayerFigmaLayer(node: GUINodeData) {
  const { exportable_layer: layer, slice9 } = node;
  if (slice9 && !isZeroVector(slice9) && isFigmaBox(layer)) {
    const placeholderLayer = findSlice9PlaceholderLayer(layer)
    if (placeholderLayer) {
      return placeholderLayer;
    }
  }
  return layer;
}

function resolvePSDLayerPosition(node: GUINodeData, nodes: GUINodeData[]): Vector4 {
  const { texture_size: textureSize, position: { x, y } } = node;
  if (textureSize) {
    const { x: width, y: height } = textureSize;
    const { x: scaleX, y: scaleY } = convertImageAttachmentScale(node);
    const parentShift = resolvePSDLayerParentShift(node, nodes);
    const pivotShift = resolvePSDLayerPivotShift(node);
    const adjustmentShift = resolvePSDLayerAdjustmentShift(node);  
    const left = x - (width * scaleX / 2) + 1024 / 2 + parentShift.x + adjustmentShift.x + pivotShift.x;
    const top = -y - (height * scaleY / 2) + 1024 / 2 - parentShift.y + adjustmentShift.y - pivotShift.y;
    return vector4(left, top, 0, 0);
  }
  return vector4(x, y, 0, 0)
}

function resolvePSDLayerAdjustmentShift(node: GUINodeData) {
  const { exportable_layer: layer } = node;
  if (isFigmaText(layer) && hasAbsoluteRenderBounds(layer) && hasAbsoluteBoundingBox(layer)) {
    const { pivot } = node;
    const { absoluteBoundingBox, absoluteRenderBounds } = layer; 
    const { x: boundingBoxX, y: boundingBoxY, width: boundingBoxWidth, height: boundingBoxHeight } = absoluteBoundingBox;
    const { x: renderBoundsX, y: renderBoundsY, width: renderBoundsWidth, height: renderBoundsHeight } = absoluteRenderBounds;
    const leftSpace = Math.ceil(renderBoundsX) - boundingBoxX; 
    const rightSpace = (boundingBoxX + boundingBoxWidth) - (Math.ceil(renderBoundsX) + Math.ceil(renderBoundsWidth))
    const topSpace = Math.ceil(renderBoundsY) - boundingBoxY;
    const bottomSpace = (boundingBoxY + boundingBoxHeight) - (Math.ceil(renderBoundsY) + Math.ceil(renderBoundsHeight))
    const x = calculatePSDLayerAdjustmentHorizontalShift(pivot, leftSpace, rightSpace)
    const y = calculatePSDLayerAdjustmentVerticalShift(pivot, topSpace, bottomSpace)
    return vector4(x, y, 0, 0)
  }
  return vector4(0);
}

function calculatePSDLayerAdjustmentHorizontalShift(pivot: Pivot, leftSpace: number, rightSpace: number) {
  if (isPivotEast(pivot)) {
    return -Math.floor(rightSpace / 2);
  }
  if (isPivotWest(pivot)) {
    return Math.floor(leftSpace / 2);
  }
  return Math.floor((leftSpace + rightSpace) / 2 - rightSpace)
}

function calculatePSDLayerAdjustmentVerticalShift(pivot: Pivot, topSpace: number, bottomSpace: number) {
  if (isPivotNorth(pivot)) {
    return -Math.floor(topSpace / 2);
  }
  if (isPivotSouth(pivot)) {
    return Math.floor(bottomSpace / 2);
  }
  return Math.floor((topSpace + bottomSpace) / 2 - bottomSpace)
}

function convertImageAttachmentScale(node: GUINodeData) {
  const { size, texture_size: textureSize, exportable_layer: layer, slice9 } = node;
  if (textureSize && !isZeroVector(textureSize)) {
    if (isFigmaText(layer)) {
      return vector4(1);
    } else if (!slice9 || isZeroVector(slice9)) {
      const { x: width, y: height } = size;
      const { x: textureWidth, y: textureHeight } = textureSize;
      const x = width / textureWidth;
      const y = height / textureHeight;
      return vector4(x, y, 0, 0);
    }
  }
  return vector4(1);
}

function resolvePSDLayerParentShift(node: GUINodeData, nodes: GUINodeData[]) {
  let { parent } = node;
  const parentShift = vector4(0);
  while (parent) {
    const parentNode = nodes.find(node => node.id === parent)
    if (parentNode) {
      const { position: { x: parentX, y: parentY } } = parentNode;
      parentShift.x += parentX;
      parentShift.y += parentY;
      ({ parent } = parentNode);
    }
  }
  return parentShift;
}

function resolvePSDLayerPivotShift(node: GUINodeData): Vector4 {
  const shift = vector4(0);
  const { pivot, texture_size: textureSize } = node;
  if (textureSize) {
    const { x: width, y: height } = textureSize
    if (isPivotNorth(pivot)) {
      shift.y = height / 2;
    } else if (isPivotSouth(pivot)) {
      shift.y = height / -2;
    }
    if (isPivotEast(pivot)) {
      shift.x = width / -2;
    } else if (isPivotWest(pivot)) {
      shift.x = width / 2;
    }
  }
  return shift;
}

export async function serializePSDData(psdLayer: PSDData): Promise<SerializedPSDData> {
  const { name, layers, filePath } = psdLayer;
  const serializedLayers = await serializePSDLayers(layers)
  const data: SerializedPSDData = {
    name,
    layers: serializedLayers,
    filePath,
  }
  return data;
}

async function serializePSDLayers(layers: PSDLayerData[]): Promise<SerializedPSDLayerData[]> {
  const serializedLayers: SerializedPSDLayerData [] = [];
  for (const layer of layers) {
    const serializedLayer = await serializePSDLayer(layer);
    serializedLayers.push(serializedLayer)
  }
  return serializedLayers;
}

async function serializePSDLayer(psdLayer: PSDLayerData): Promise<SerializedPSDLayerData> {
  const { name, left: x, top: y, layer } = psdLayer
  const data = await layer.exportAsync({ format: "PNG", contentsOnly: true });
  const serializedLayer: SerializedPSDLayerData = {
    name,
    data,
    left: x,
    top: y,
  }
  return serializedLayer;
}
