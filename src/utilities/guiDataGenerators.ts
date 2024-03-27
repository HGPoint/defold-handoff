import config from "config/config.json";
import { setPluginData, findMainComponent, hasChildren, isAtlas, isFigmaSceneNode, isFigmaComponentInstance, isFigmaBox, isFigmaText, isExportable } from "utilities/figma";
import { vector4 } from "utilities/math";
import { convertGUIData, convertBoxGUINodeData, convertTextGUINodeData } from "utilities/guiDataConverters";
import { isSlice9PlaceholderLayer, findOriginalLayer, isSlice9Layer, isSlice9ServiceLayer, parseSlice9Data } from "utilities/slice9";
import { generateAtlasPath, generateFontPath } from "utilities/path";

async function tryRestoreSlice9Data(layer: ExportableLayer) {
  if (isFigmaBox(layer)) {
    if (isSlice9PlaceholderLayer(layer)) {
      const originalLayer = findOriginalLayer(layer);
      if (originalLayer) {
        const slice9 = parseSlice9Data(layer);
        if (slice9) {
          setPluginData(originalLayer, { defoldSlice9: true });
          setPluginData(originalLayer, { defoldGUINode: { slice9 } });
        }
      }
    }
    if (hasChildren(layer)) {
      for (const child of layer.children) {
        if (isFigmaBox(child)) {
          await tryRestoreSlice9Data(child);
        }
      }
    }
  }
}

function calculateParentParameters(layer: ExportableLayer, shouldSkip: boolean, atRoot?: boolean, parentPivot?: Pivot, parentId?: string, parentSize?: Vector4, guiNodeData?: GUINodeData):  { parentId: string | undefined, parentSize: Vector4, parentPivot: Pivot } {
  if (atRoot) {
    return {
      parentId: "",
      parentSize: vector4(layer.width, layer.height, 0, 1),
      parentPivot: config.guiNodeDefaultValues.pivot,
    }
  } else if (shouldSkip) {
    return {
      parentId: parentId,
      parentSize: parentSize || vector4(layer.width, layer.height, 0, 1),
      parentPivot: parentPivot || config.guiNodeDefaultValues.pivot,
    }
  }
  return {
    parentId: layer.name,
    parentSize: vector4(layer.width, layer.height, 0, 1),
    parentPivot: guiNodeData ? guiNodeData.pivot : config.guiNodeDefaultValues.pivot,
  }
}

async function generateGUINodeData(layer: ExportableLayer, guiNodesData: GUINodeData[], parentPivot: Pivot, atRoot?: boolean, parentId?: string, parentSize?: Vector4) {
  if (layer.visible || isSlice9Layer(layer)) {
    if (isFigmaBox(layer) && !isSlice9ServiceLayer(layer)) {
      const shouldSkip = isSlice9PlaceholderLayer(layer);
      let guiNodeData: GUINodeData | undefined;
      if (!atRoot && !shouldSkip) {
        guiNodeData = await convertBoxGUINodeData(layer, parentPivot, parentId, parentSize);
        guiNodesData.push(guiNodeData);
      }
      if (hasChildren(layer)) {
        for (const child of layer.children) {
          if (isExportable(child) && !isSlice9ServiceLayer(layer)) {
            ({ parentId, parentSize, parentPivot } = calculateParentParameters(layer, shouldSkip, atRoot, parentPivot, parentId, parentSize, guiNodeData));
            await generateGUINodeData(child, guiNodesData, parentPivot, false, parentId, parentSize);
          }
        }
      }
    } else if (isFigmaText(layer)) {
      const guiNodeData = convertTextGUINodeData(layer, parentPivot, parentId, parentSize);
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
  tryRestoreSlice9Data(layer);
  const { name } = layer;
  const gui = convertGUIData();
  const nodes: GUINodeData[] = [];
  await generateGUINodeData(layer, nodes, config.guiNodeDefaultValues.pivot, true);
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
