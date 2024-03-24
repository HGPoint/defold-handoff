import config from "config/config.json";
import { findMainComponent, hasChildren, isAtlas, isFigmaSceneNode, isFigmaComponentInstance, isFigmaBox, isFigmaText, isFigmaExportable } from "utilities/figma";
import { vector4 } from "utilities/math";
import { convertGUIData, convertBoxGUINodeData, convertTextGUINodeData } from "utilities/guiDataConverters";
import { generateAtlasPath, generateFontPath } from "utilities/path";

async function generateGUINodeData(layer: ExportableLayer, guiNodesData: GUINodeData[], atRoot?: boolean, parentId?: string, parentSize?: Vector4) {
  if (layer.visible) {
    if (isFigmaBox(layer)) {
      if (!atRoot) {
        const guiNodeData = await convertBoxGUINodeData(layer, parentId, parentSize);
        guiNodesData.push(guiNodeData); 
      }
      if (hasChildren(layer)) {
        const parentId = !atRoot ? layer.name : undefined;
        const parentSize = vector4(layer.width, layer.height, 0, 1);
        for (const child of layer.children) {
          if (isFigmaExportable(child)) {
            await generateGUINodeData(child, guiNodesData, false, parentId, parentSize);
          }
        }
      }
    } else if (isFigmaText(layer)) {
      const guiNodeData = convertTextGUINodeData(layer, parentId, parentSize);
      guiNodesData.push(guiNodeData);
    }
  }
}

async function generateTextureData(layer: SceneNode, texturesData: TextureData) {
  if (isFigmaBox(layer)) {
    if (isFigmaComponentInstance(layer)) {
      const mainComponent = await findMainComponent(layer);
      if (mainComponent) {
        const { parent } = mainComponent;
        if (isFigmaSceneNode(parent) && isAtlas(parent)) {
          const texture = parent.name;
          if (!texturesData[texture]) {
            const path = generateAtlasPath(texture);
            const id = parent.id;
            texturesData[texture] = {
              path,
              id
            };
          }
        }
      }
    }
    if (hasChildren(layer)) {
      for (const child of layer.children) {
        await generateTextureData(child, texturesData);
      }
    }
  }
}

async function generateFontData(layer: SceneNode, fontData: FontData) {
  if (isFigmaBox(layer)) {
    if (hasChildren(layer)) {
      for (const child of layer.children) {
        await generateFontData(child, fontData);
      }
    }
  }
  if (isFigmaText(layer)) {
    const font = config.fontFamily;
    const path = generateFontPath(font);
    if (!fontData[font]) {
      fontData[font] = path;
    }
  }
}

async function generateGUIData(layer: ExportableLayer): Promise<GUIData> {
  const { name } = layer;
  const gui = convertGUIData();
  const nodes: GUINodeData[] = [];
  await generateGUINodeData(layer, nodes, true);
  const textures: TextureData = {};
  await generateTextureData(layer, textures);  
  const fonts = {};
  await generateFontData(layer, fonts);
  return {
    name,
    gui,
    nodes,
    textures,
    fonts,
  };
}

export async function generateGUIDataSet(layers: ExportableLayer[]): Promise<GUIData[]> {
  const guiNodesDataSets = layers.map(generateGUIData);
  return Promise.all(guiNodesDataSets);
}
