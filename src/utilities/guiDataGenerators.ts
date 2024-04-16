import config from "config/config.json";
import { projectConfig } from "handoff/project";
import { getDefoldGUINodePluginData } from "utilities/gui";
import { setPluginData, findMainComponent, hasChildren, isAtlas, isAtlasSection, isFigmaSceneNode, isFigmaComponentInstance, isFigmaBox, isFigmaText, isExportable, isAtlasSprite, getPluginData, equalComponentProperties, equalExposedComponentProperties } from "utilities/figma";
import { vector4, areVectorsEqual, copyVector, addVectors } from "utilities/math";
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
    parentChildren: []
  }
}

function calculateParentParameters(shouldSkip: boolean, parentOptions: GUINodeDataExportOptions, guiNodeData: GUINodeData): Pick<GUINodeDataExportOptions, "parentId" | "parentPivot" | "parentSize" | "parentShift" | "parentChildren"> {
  const { parentId, parentSize, parentPivot, parentShift, parentChildren } = parentOptions;
  if (shouldSkip) {
    return {
      parentId: parentId,
      parentSize: parentSize,
      parentPivot: parentPivot,
      parentShift: addVectors(parentShift, guiNodeData.figma_position),
      parentChildren: parentChildren
    }
  }
  return {
    parentId: guiNodeData.id,
    parentSize: guiNodeData.size,
    parentPivot: guiNodeData.pivot,
    parentShift: vector4(0),
    parentChildren: guiNodeData.children
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
  const parentParameters = calculateParentParameters(shouldSkip, parentOptions, parentGUINodeData);
  return {
    layer,
    atRoot,
    namePrefix,
    ...parentParameters,
  }
}

function createClone(mainComponent: ComponentNode, clone: InstanceNode): GUINodeCloneData {
  return {
    cloneOf: mainComponent,
    cloneInstance: clone,
  }
}

function findClone(data: GUINodeCloneData, mainComponent: ComponentNode, layer: InstanceNode) {
  return (
    data.cloneOf === mainComponent &&
    equalComponentProperties(data.cloneInstance.componentProperties, layer.componentProperties) &&
    equalExposedComponentProperties(data.cloneInstance.exposedInstances, layer.exposedInstances)
  );
}

async function generateGUINodeData(options: GUINodeDataExportOptions, guiNodesData?: GUINodeData[], clones?: ReturnType<typeof createClone>[]) {
  if (guiNodesData) {
    const { layer } = options;
    if (layer.visible || isSlice9Layer(layer)) {
      if (isFigmaBox(layer) && !isSlice9ServiceLayer(layer)) {
        let alreadyCloned = false;
        const guiNodeData = await convertBoxGUINodeData(layer, options);  
        if (guiNodeData.cloneable && isFigmaComponentInstance(layer)) {
          const mainComponent = await findMainComponent(layer);
          if (mainComponent) {
            if (clones?.find((clone) => findClone(clone, mainComponent, layer))) {
              alreadyCloned = true;
            } else {
              if (!clones) {
                clones = [];
              }
              const clone = createClone(mainComponent, layer);
              clones.push(clone);
            }
          }
        }
        if (!alreadyCloned) {
          const shouldSkip = await isSkippable(layer, guiNodeData);
          if (!shouldSkip) {
            guiNodesData.push(guiNodeData);
          }
          if (hasChildren(layer)) {
            const { children: layerChildren } = layer; 
            if (!shouldSkip) {
              guiNodeData.children = [];
            }
            for (const layerChild of layerChildren) {
              if (isExportable(layerChild) && !isSlice9ServiceLayer(layer)) {
                const parentOptions = generateParentOptions(layerChild, shouldSkip, false, options, guiNodeData);
                const children = !shouldSkip ? guiNodeData.children :  parentOptions.parentChildren;
                await generateGUINodeData(parentOptions, children, clones);
              }
            }
          }
        }
      } else if (isFigmaText(layer)) {
        const guiNodeData = convertTextGUINodeData(layer, options);
        guiNodesData.push(guiNodeData);
      }
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
    for (const font of projectConfig.fontFamilies) {
      const path = generateFontPath(font);
      if (!fontData[font]) {
        fontData[font] = path;
      }
    }
    return;
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
          const data = getDefoldGUINodePluginData(originalLayer);
          setPluginData(originalLayer, { defoldGUINode: { ...data, slice9 } });
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
    !parent.texture &&
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

function collapseGUINodeData(nodes: GUINodeData[], collapsedNodes: GUINodeData[]) {
  for (const node of nodes) {
    collapsedNodes.push(node);
    if (node.children) {
      const { children } = node;
      const collapsableChild = children.find(child => canCollapseNodes(node, child));
      if (collapsableChild) {
        collapseNodes(node, collapsableChild);
        const index = children.indexOf(collapsableChild);
        children.splice(index, 1);
      }
      collapseGUINodeData(children, collapsedNodes);
    }
  }
}

export async function generateGUIData(layer: ExportableLayer): Promise<GUIData> {
  tryRestoreSlice9Data(layer);
  const { name } = layer;
  const gui = convertGUIData();
  const rootOptions = generateRootOptions(layer);
  const nodes: GUINodeData[] = [];
  await generateGUINodeData(rootOptions, nodes, [] as GUINodeCloneData[]);
  const collapsedNodes: GUINodeData[] = [];
  collapseGUINodeData(nodes, collapsedNodes);
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
