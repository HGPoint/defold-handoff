type SelectionData = {
  defoldComponents: SceneNode[];
  defoldAtlases: ComponentNode[];
  figmaLayers: SceneNode[];
}

type AtlasData = SpriteData[];

type SpriteData = {
  name: string;
  data: Uint8Array;
}