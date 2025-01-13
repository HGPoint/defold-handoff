type GameCollectionData = {
  name: string,
  collection: GameCollectionDefoldData,
  gameObjects: GameObjectData[],
  textures?: TextureData,
  filePath: string,
}

type GameCollectionDefoldData = {
  name: string,
  scale_along_z: number
}

type GameObjectData = {
  type?: GameObjectType,
  id: string,
  children?: string[],
  position: Vector4,
  rotation: Vector4,
  scale: Vector4,
  size?: Vector4,
  text?: string,
  color?: Vector4,
  outline?: Vector4,
  shadow?: Vector4,
  line_break?: boolean,
  leading?: number,
  tracking?: number,
  image?: string,
  default_animation?: string,
  size_mode?: SizeMode,
  slice9?: Vector4,
  pivot?: Pivot,
  blend_mode?: BlendingMode,
  material?: string,
  textures?: string,
  
  skip: boolean,
  implied_game_object: boolean,
  arrange_depth: boolean,
  depth_axis?: string,
  path: string,
  exclude: boolean,
  inferred: boolean,
  exportable_layer: ExportableLayer,
  exportable_layer_name: string,
  exportable_layer_id: string,
  figma_position: Vector4,
  components?: GameObjectData[],
}

type GameObjectDataExportOptions = {
  layer: ExportableLayer,
  atRoot: boolean,
  namePrefix: string,
  forcedName?: string,
  parentId: string,
  parentSize: Vector4,
  parentShift: Vector4,
  arrangeDepth: boolean,
  depthAxis?: string,
}

type SerializedGameCollectionData = {
  name: string,
  data: string,
  filePath?: string,
}
