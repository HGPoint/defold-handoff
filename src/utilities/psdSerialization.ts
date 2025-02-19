/**
 * 
 * @packageDocumentation
 */

export async function serializePSDData(data: PSDData): Promise<SerializedPSDData> {
  const { name, layers, filePath, size } = data;
  const serializedLayers = await serializePSDLayers(layers)
  const serializedData: SerializedPSDData = {
    name,
    size,
    layers: serializedLayers,
    filePath,
  }
  return serializedData;
}

async function serializePSDLayers(layers: PSDLayerData[]): Promise<SerializedPSDLayerData[]> {
  const serializedLayers: SerializedPSDLayerData[] = [];
  for (const layer of layers) {
    const serializedLayer = await serializePSDLayer(layer);
    serializedLayers.push(serializedLayer)
  }
  return serializedLayers;
}

async function serializePSDLayer(psdLayer: PSDLayerData): Promise<SerializedPSDLayerData> {
  const { name, left: x, top: y, layer } = psdLayer
  const data = await layer.exportAsync({ format: "PNG" });
  const serializedLayer: SerializedPSDLayerData = {
    name,
    data,
    left: x,
    top: y,
  }
  return serializedLayer;
}
