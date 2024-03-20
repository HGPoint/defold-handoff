import config from "../config/config.json";
import { findMainComponent, hasChildren, isAtlas, isFigmaSceneNode, isFigmaComponentInstance, isFigmaBox, isFigmaText } from "./figma";
import { vector4 } from "./math";
import { convertGUIData, convertBoxGUINodeData, convertTextGUINodeData } from "./dataConverters";
import { generateTexturePath, generateFontPath } from "./path";

async function findGUINodes(layer: SceneNode, guiNodesData: GUINodeData[], atRoot?: boolean, parentId?: string, parentSize?: Vector4) {
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
          await findGUINodes(child, guiNodesData, false, parentId, parentSize);
        }
      }
    } else if (isFigmaText(layer)) {
      const guiNodeData = convertTextGUINodeData(layer, parentId, parentSize);
      guiNodesData.push(guiNodeData);
    }
  }
}

async function findTextures(layer: SceneNode, texturesData: TextureData) {
  if (isFigmaBox(layer)) {
    if (isFigmaComponentInstance(layer)) {
      const mainComponent = await findMainComponent(layer);
      if (mainComponent) {
        const { parent } = mainComponent;
        if (isFigmaSceneNode(parent) && isAtlas(parent)) {
          const texture = parent.name;
          if (!texturesData[texture]) {
            const path = generateTexturePath(texture);
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
        await findTextures(child, texturesData);
      }
    }
  }
}

async function findFonts(layer: SceneNode, fontData: FontData) {
  if (isFigmaBox(layer)) {
    if (hasChildren(layer)) {
      for (const child of layer.children) {
        await findFonts(child, fontData);
      }
    }
  }
  if (isFigmaText(layer)) {
    const font = config.defoldFontFamily;
    const path = generateFontPath(font);
    if (!fontData[font]) {
      fontData[font] = path;
    }
  }
}

async function generateDefoldData(component: FrameNode | InstanceNode): Promise<DefoldData> {
  const name = component.name;
  const gui = convertGUIData();
  const nodes: GUINodeData[] = [];
  await findGUINodes(component, nodes, true);
  const textures: TextureData = {};
  await findTextures(component, textures);  
  const fonts = {};
  await findFonts(component, fonts);
  return {
    name,
    gui,
    nodes,
    textures,
    fonts,
  };
}

export async function generateDefoldDataSet(components: FrameNode[]): Promise<DefoldData[]> {
  const guiNodesDataSets = components.map(generateDefoldData);
  return Promise.all(guiNodesDataSets);
}
