import config from "config/config.json";
import { setPluginData, findMainComponent, hasChildren, isAtlas, isAtlasSection, isFigmaSceneNode, isFigmaComponentInstance, isFigmaBox, isFigmaText, isExportable, isAtlasSprite, getPluginData } from "utilities/figma";
import { vector4, areVectorsEqual, copyVector } from "utilities/math";
import { convertGUIData, convertBoxGUINodeData, convertTextGUINodeData } from "utilities/guiDataConverters";
import { isSlice9PlaceholderLayer, findOriginalLayer, isSlice9Layer, isSlice9ServiceLayer, parseSlice9Data } from "utilities/slice9";
import { generateAtlasPath, generateFontPath } from "utilities/path";

async function isSkippable(layer: ExportableLayer, gUINodeData: GUINodeData): Promise<boolean> {
  return gUINodeData.skip || isSlice9PlaceholderLayer(layer) || await isSpriteHolderLayer(layer);
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

function generateNamePrefix(shouldSkip: boolean, options: GUINodeDataExportOptions): string {
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
  const namePrefix = generateNamePrefix(shouldSkip, parentOptions);
  const parentParameters = calculateParentParameters(layer, shouldSkip, atRoot, parentOptions, parentGUINodeData);
  return {
    layer,
    atRoot,
    namePrefix,
    ...parentParameters,
  }
}

async function generateGUINodeData(options: GUINodeDataExportOptions, guiNodesData: GUINodeData[], cloneableComponents?: ComponentNode[]) {
  const { layer } = options;
  if (layer.visible || isSlice9Layer(layer)) {
    let mainComponent: ComponentNode | null = null;
    if (isFigmaComponentInstance(layer)) {
      mainComponent = await findMainComponent(layer);
    }
    if (isFigmaBox(layer) && !isSlice9ServiceLayer(layer)) {
      const guiNodeData = await convertBoxGUINodeData(layer, options);
      const shouldSkip = await isSkippable(layer, guiNodeData);
      if (!shouldSkip) {
        if (mainComponent) {
          if (!cloneableComponents) {
            cloneableComponents = [];
          }
          cloneableComponents.push(mainComponent);
        }
        guiNodesData.push(guiNodeData);
      }
      if (hasChildren(layer)) {
        const { children } = layer; 
        for (const child of children) {
          if (isExportable(child) && !isSlice9ServiceLayer(layer)) {
            const parentOptions = generateParentOptions(child, shouldSkip, false, options, guiNodeData);
            await generateGUINodeData(parentOptions, guiNodesData, cloneableComponents);
          }
        }
      }
    } else if (isFigmaText(layer)) {
      const guiNodeData = convertTextGUINodeData(layer, options);
      guiNodesData.push(guiNodeData);
    }
  }
}

function generateTextureData(name: string, layer: SceneNode, texturesData: TextureData) {
  if (!texturesData[name]) {
    const path = generateAtlasPath(name);
    const { id } = layer;
    texturesData[name] = {
      path,
      id
    };
  }
}

function updateTextureData(atlas: SceneNode, texturesData: TextureData) {
  const { parent: section } = atlas
  if (isFigmaSceneNode(section) && isAtlasSection(section)) {
    const sectionData = getPluginData(section, "defoldSection");
    if (sectionData?.bundled) {
      generateTextureData(atlas.name, atlas, texturesData);
      for (const child of section.children) {
        if (isFigmaSceneNode(child) && isAtlas(child)) {
          generateTextureData(child.name, child, texturesData);
        }
      }
    } else if (sectionData?.jumbo) {
      const name = sectionData?.jumbo;
      generateTextureData(name, section, texturesData);
    }
  } else {
    generateTextureData(atlas.name, atlas, texturesData);
  }
}

async function generateTexturesData(layer: SceneNode, texturesData: TextureData) {
  if (isFigmaBox(layer)) {
    if (isFigmaComponentInstance(layer)) {
      const mainComponent = await findMainComponent(layer);
      if (mainComponent) {
        const { parent: atlas } = mainComponent;
        if (isFigmaSceneNode(atlas) && isAtlas(atlas)) {
          updateTextureData(atlas, texturesData);
        }
      }
    }
    if (hasChildren(layer)) {
      for (const child of layer.children) {
        await generateTexturesData(child, texturesData);
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

export async function generateGUIData(layer: ExportableLayer): Promise<GUIData> {
  tryRestoreSlice9Data(layer);
  const { name } = layer;
  const gui = convertGUIData();
  const rootOptions = generateRootOptions(layer);
  const nodes: GUINodeData[] = [];
  await generateGUINodeData(rootOptions, nodes);
  const collapsedNodes = nodes.reduce(guiDataCollapser, [] as GUINodeData[]);
  const textures: TextureData = {};
  await generateTexturesData(layer, textures);
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
