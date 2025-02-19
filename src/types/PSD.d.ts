type PSDData = {
  name: string,
  size: Vector4,
  layers: PSDLayerData[],
  filePath: string,
}

type PSDLayerData = {
  name: string,
  layer: SceneNode,
  left: number,
  top: number,
}

type SerializedPSDData = {
  name: string,
  size: Vector4,
  layers: SerializedPSDLayerData[],
  filePath: string,
}

type SerializedPSDLayerData = {
  name: string,
  data: WithNull<Uint8Array>,
  left: number,
  top: number,
}

