import config from "config/config.json";
import { setPluginData, findMainComponent, hasChildren, isAtlas, isFigmaSceneNode, isFigmaComponentInstance, isFigmaBox, isFigmaText, isExportable, isAtlasSprite } from "utilities/figma";
import { vector4, areVectorsEqual, copyVector } from "utilities/math";
import { convertGUIData, convertBoxGUINodeData, convertTextGUINodeData } from "utilities/guiDataConverters";
import { isSlice9PlaceholderLayer, findOriginalLayer, isSlice9Layer, isSlice9ServiceLayer, parseSlice9Data } from "utilities/slice9";
import { generateAtlasPath, generateFontPath } from "utilities/path";

async function isSkippable(layer: ExportableLayer): Promise<boolean> {
  return isSlice9PlaceholderLayer(layer) || await isSpriteHolderLayer(layer);
}

async function isSpriteHolderLayer(layer: ExportableLayer): Promise<boolean> {
  if (isFigmaComponentInstance(layer)) {
    if (layer.children.length === 1) {
      const [child] = layer.children;
      if (!isSlice9PlaceholderLayer(child)) {
        const sameSize = layer.width === child.width && layer.height == child.height;
        return sameSize && await isAtlasSprite(child);
      }
      return true;
    }
  }
  return false;
}

function generateRootOptions(layer: ExportableLayer): GUINodeDataExportOptions {
  return {
    layer,
    atRoot: true,
    namePrefix: "",
    parentId: "",
    parentPivot: config.guiNodeDefaultValues.pivot,
    parentSize: vector4(0),
    parentShift: vector4(0),
  }
}

function calculateParentParameters(layer: ExportableLayer, shouldSkip: boolean, atRoot: boolean, parentOptions: GUINodeDataExportOptions, guiNodeData: GUINodeData): Pick<GUINodeDataExportOptions, "parentId" | "parentPivot" | "parentSize" | "parentShift"> {
  const { parentId, parentSize, parentPivot } = parentOptions;
  if (atRoot) {
    return {
      parentId: "",
      parentSize: vector4(layer.width, layer.height, 0, 1),
      parentPivot: config.guiNodeDefaultValues.pivot,
      parentShift: vector4(0),
    }
  } else if (shouldSkip) {
    return {
      parentId: parentId,
      parentSize: parentSize,
      parentPivot: parentPivot,
      parentShift: guiNodeData.position
    }
  }
  return {
    parentId: guiNodeData.id,
    parentSize: guiNodeData.size,
    parentPivot: guiNodeData.pivot,
    parentShift: vector4(0),
  }
}

function generateNamePrefix(layer: ExportableLayer, shouldSkip: boolean, options: GUINodeDataExportOptions): string {
  if (shouldSkip) {
    if (options.namePrefix) {
      return options.namePrefix;
    }
    return "";
  } else if (isFigmaComponentInstance(options.layer)) {
    return `${options.layer.name}_`;
  }
  return "";
}

function generateParentOptions(layer: ExportableLayer, shouldSkip: boolean, atRoot: boolean, parentOptions: GUINodeDataExportOptions, parentGUINodeData: GUINodeData): GUINodeDataExportOptions {
  const namePrefix = generateNamePrefix(layer, shouldSkip, parentOptions);
  const parentParameters = calculateParentParameters(layer, shouldSkip, atRoot, parentOptions, parentGUINodeData);
  return {
    layer,
    atRoot,
    namePrefix,
    ...parentParameters,
  }
}

async function generateGUINodeData(options: GUINodeDataExportOptions, guiNodesData: GUINodeData[]) {
  const { layer } = options;
  if (layer.visible || isSlice9Layer(layer)) {
    if (isFigmaBox(layer) && !isSlice9ServiceLayer(layer)) {
      const shouldSkip = await isSkippable(layer);
      const guiNodeData = await convertBoxGUINodeData(layer, options);
      if (!shouldSkip) {
        guiNodesData.push(guiNodeData);
      }
      if (hasChildren(layer)) {
        const { children } = layer; 
        for (const child of children) {
          if (isExportable(child) && !isSlice9ServiceLayer(layer)) {
            const parentOptions = generateParentOptions(child, shouldSkip, false, options, guiNodeData);
            await generateGUINodeData(parentOptions, guiNodesData);
          }
        }
      }
    } else if (isFigmaText(layer)) {
      const guiNodeData = convertTextGUINodeData(layer, options);
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

function canCollapseNodes(parent: GUINodeData, child: GUINodeData): boolean {
  return (
    areVectorsEqual(parent.size, child.size) &&
    parent.type === child.type &&
    !parent.visible &&
    child.visible &&
    !!child.texture
  );
}

function collapseNodes(parent: GUINodeData, child: GUINodeData) {
  parent.visible = true;
  parent.texture = child.texture;
  parent.color = child.color;
  parent.size_mode = child.size_mode;
  parent.slice9 = copyVector(child.slice9);
  parent.material = child.material;
  parent.adjust_mode = child.adjust_mode;
  parent.blend_mode = child.blend_mode;
}

function guiDataCollapser(collapsedNodes: GUINodeData[], node: GUINodeData, index: number, nodes: GUINodeData[]): GUINodeData[] {
  const { parent: parentId } = node;
  if (parentId) {
    const parent = nodes.find(({ id }) => id === parentId);
    if (parent && canCollapseNodes(parent, node)) {
      collapseNodes(parent, node);
    } else {
      collapsedNodes.push(node);
    }
  } else {
    collapsedNodes.push(node);
  }
  return collapsedNodes;
}

async function generateGUIData(layer: ExportableLayer): Promise<GUIData> {
  tryRestoreSlice9Data(layer);
  const { name } = layer;
  const gui = convertGUIData();
  const rootOptions = generateRootOptions(layer);
  const nodes: GUINodeData[] = [];
  await generateGUINodeData(rootOptions, nodes);
  const collapsedNodes = nodes.reduce(guiDataCollapser, [] as GUINodeData[]);
  const textures: TextureData = {};
  await generateTextureData(layer, textures);  
  const fonts = {};
  await generateFontData(layer, fonts);
  return {
    name,
    gui,
    nodes: collapsedNodes,
    textures,
    fonts,
  };
}

export async function generateGUIDataSet(layers: ExportableLayer[]): Promise<GUIData[]> {
  const guiNodesDataSets = layers.map(generateGUIData);
  return Promise.all(guiNodesDataSets);
}
