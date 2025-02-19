/**
 * 
 * @packageDocumentation
 */

import config from "config/config.json";
import { isFigmaBox, isFigmaText } from "utilities/figma";
import { hasGUITexture } from "utilities/gui";
import { addValueToVector, isZeroVector } from "utilities/math";
import { serializePSDData } from "utilities/psdSerialization";
import { findSlice9PlaceholderLayer } from "utilities/slice9";

export const PSD_SERIALIZATION_PIPELINE: TransformPipeline<PSDData, SerializedPSDData> = {
  transform: serializePSDData,
};

export function resolvePSDFilePath() {
  return "";
}

export function resolvePSDFileSize(guiData: GUIData) {
  const { size } = guiData;
  const { psdPadding } = config;
  const canvasSize = addValueToVector(size, psdPadding);
  return canvasSize;
}

export function ensurePSDLayer(node: GUINodeData) {
  const { exportable_layer: layer, slice9 } = node;
  if (isFigmaBox(layer) && slice9 && !isZeroVector(slice9)) {
    const placeholderLayer = findSlice9PlaceholderLayer(layer)
    if (placeholderLayer) {
      return placeholderLayer;
    }
  }
  return layer;
}

export function resolvePSDLayerSize(node: GUINodeData) {
  const { size, exportable_layer: layer } = node;
  if (isFigmaText(layer) && hasGUITexture(node)) {
    const { texture_size: textureSize } = node;
    return textureSize
  }
  return size
}
