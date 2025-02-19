/**
 * 
 * @packageDocumentation
 */

import { hasGUITexture } from "utilities/gui";
import { ensurePSDLayer } from "utilities/psd";
import { convertPSDLayerName, convertPSDLayerPosition } from "utilities/psdConversion";

export function generatePSDLayerData(nodes: GUINodeData[], canvasSize: Vector4) {
  const slots = nodes.reduce((psdLayers: PSDLayerData[], node: GUINodeData, index: number, nodes: GUINodeData[]) => psdLayerDataReducer(psdLayers, node, nodes, canvasSize), []);
  return slots;
}

function psdLayerDataReducer(psdLayers: PSDLayerData[], node: GUINodeData, nodes: GUINodeData[], canvasSize: Vector4) {
  if (hasGUITexture(node)) {
    const name = convertPSDLayerName(node);
    const { x: left, y: top } = convertPSDLayerPosition(node, nodes, canvasSize)
    const layer = ensurePSDLayer(node);
    const psdLayer: PSDLayerData = {
      name,
      left,
      top,
      layer,
    };
    psdLayers.push(psdLayer);
  }
  return psdLayers;
}
