type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;


type SelectionData = {
  defoldComponents: FrameNode[];
  defoldAtlases: ComponentSetNode[];
  figmaLayers: SceneNode[];
}

type AtlasData = {
  name: string;
  sprites: SpriteData[];
}

type SpriteData = {
  name: string;
  data: Uint8Array;
}

type DefoldData = {
  defoldAtlas?: DefoldAtlasData;
  defoldComponent?: DefoldComponentData;
}

type DefoldAtlasData = {
  id?: string;
}

type DefoldComponentData = {
  id?: string;
  defoldPivot?: string;
  defoldAnchorX?: string;
  defoldAnchorY?: string;
}

type DefoldPathsData = {
  assetsPath: string;
  atlasAssetsPath: string;
  imageAssetsPath: string;
  fontAssetsPath: string;
  spineAssetsPath: string;
}

type Vector4 = {
  x: number;
  y: number;
  z: number;
  w: number;
}

type SizeMode = "SIZE_MODE_AUTO" | "SIZE_MODE_MANUAL";

type DefoldObjectGUI = {
  background_color: Vector4,
  material: string,
  adjust_reference: string,
  max_nodes: number
}

type DefoldObjectGUIKeyType = keyof DefoldObjectGUI;

type DefoldObjectGUIValueType = DefoldObjectGUI[DefoldObjectGUIKeyType];

type DefoldObjectNode = {
  id: string,
  parent?: string,
  enabled: boolean,
  visible: boolean,
  position: Vector4,
  rotation: Vector4,
  scale: Vector4,
  size: Vector4,
  color: Vector4,
  texture: string,
  type: string,
  size_mode: string,
  slice9: Vector4,
  layer: string,
  inherit_alpha: boolean,
  xanchor: string,
  yanchor: string,
  pivot: string,
  adjust_mode: string,
  clipping_mode: string,
  clipping_visible: boolean,
  clipping_inverted: boolean,
  blend_mode: string,
  custom_type: number,
  template_node_child: boolean,
}

type DefoldObjectNodeKeyType = keyof DefoldObjectNode;

type DefoldObjectNodeValueType = DefoldObjectNode[DefoldObjectNodeKeyType];

type DefoldObjectTexture = Record<string, string>;

type DefoldObject = {
  name: string;
  gui: DefoldObjectGUI;
  nodes: DefoldObjectNode[];
  textures: DefoldObjectTexture;
}

type DefoldComponent = {
  name: string;
  data: string;
}
