import { propertySerializer } from "utilities/dataSerializers";

function guiNodeDataSerializer(data: string, guiNodeData: GUINodeData): string {
  const guiNode = Object.entries(guiNodeData).reduce(propertySerializer, "");
  return `${data}\nnodes\n{\n${guiNode}}`;
}

function textureDataSerializer(data: string, [name, texture]: [string, TextureAtlasData]): string {
  return `${data}\ntextures\n{\n  name: "${name}"\n  texture: "${texture.path}"\n}`;
}

function fontsDataSerializer(data: string, [name, fontPath]: [string, string]): string {
  return `${data}\nfonts\n{\n  name: "${name}"\n  font: "${fontPath}"\n}`;
}

export function serializeGUIData(guiData: GUIData): SerializedGUIData {
  const { name } = guiData;
  const gui = Object.entries(guiData.gui).reduce(propertySerializer, "");
  const nodes = guiData.nodes.reduce(guiNodeDataSerializer, "");
  const textures = Object.entries(guiData.textures).reduce(textureDataSerializer, "")
  const fonts = Object.entries(guiData.fonts).reduce(fontsDataSerializer, "");
  const data = `${gui}${textures}${fonts}${nodes}`;
  return {
    name,
    data
  };
}

export function serializeGUIDataSet(guiDataSet: GUIData[]): SerializedGUIData[] {
  return guiDataSet.map(serializeGUIData);
}
