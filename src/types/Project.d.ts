type ProjectData = {
  screenSize: Vector4,
  paths: ProjectPathData,
  fontSize: number,
  fontStrokeRatio: number,
  fontFamilies: ProjectFontData[],
  autoskip: string,
}

type ProjectPathData = {
  assetsPath: string,
  atlasAssetsPath: string,
  imageAssetsPath: string,
  fontAssetsPath: string,
  spineAssetsPath: string,
}

type ProjectFontData = {
  id: string,
  name: string,
}

type ProjectLayerData = {
  id: string,
  name: string,
}

type ProjectMaterialData = {
  id: string,
  name: string,
  path: string,
}