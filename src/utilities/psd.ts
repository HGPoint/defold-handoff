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

function reducePSDLayerData(layers: PSDLayerData[], node: GUINodeData) {
  if (node.texture) {
    const { id: name, exportable_layer: layer, size: { x: width, y: height }, position: { x, y } } = node;
    const psdLayer: PSDLayerData = {
      name,
      layer,
      left: x,
      top: y,
      width,
      height
    };
    layers.push(psdLayer);
  }
  return layers;
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
  const { name, left: x, top: y, width, height, layer } = psdLayer
  const data = await layer.exportAsync({ format: "PNG" });
  const serializedLayer: SerializedPSDLayerData = {
    name,
    data,
    left: x,
    top: y,
    width,
    height,
  }
  return serializedLayer;
}
