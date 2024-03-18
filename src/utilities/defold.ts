import config from "../config/config.json";
import { vector4 } from "./math";
import { isDefoldAtlas } from "../defold/atlas";

function convertParent(parentId: string) {
  return parentId ? { parent: parentId } : {};
}

function convertPosition(component: FrameNode | InstanceNode, parentSize: Vector4 | null) {
  if (!parentSize) {
    return vector4(component.x, component.y, 0, 1);
  }
  const x = component.x + (component.width / 2)  - parentSize.x / 2;
  const y = parentSize.y / 2 - component.y - (component.height / 2);
  return vector4(x, y, 0, 1);
}

function convertRotation(component: FrameNode | InstanceNode) {
  return vector4(0, 0, component.rotation, 1);
}

function convertScale() {
  return vector4(1);
}

function convertSize(component: FrameNode | InstanceNode) {
  return vector4(component.width, component.height, 0, 1);
}

function calculateSizeMode(texture: string): SizeMode {
  return texture ? "SIZE_MODE_AUTO" : "SIZE_MODE_MANUAL";
}

function convertTransformations(component: FrameNode | InstanceNode, parentSize: Vector4 | null) {
  const position = convertPosition(component, parentSize);
  const rotation = convertRotation(component);
  const scale = convertScale();
  const size = convertSize(component);
  return {
    position,
    rotation,
    scale,
    size,
  };
}

function calculateColor() {
  return vector4(1);
}

async function calculateTexture(component: FrameNode | InstanceNode) {
  if (component.type === "INSTANCE") {
    const mainComponent = await component.getMainComponentAsync();
    if (mainComponent) {
      const componentSet = mainComponent.parent as ComponentSetNode;
      if (isDefoldAtlas(componentSet)) {
        const texture = componentSet.name;
        const sprite = component.variantProperties?.Sprite;
        if (sprite) {
          return `${texture}/${sprite}`;
        }
      }
    }
  }
  return "";
}

function calculateVisible(component: FrameNode | InstanceNode, texture: string) {
  return !!texture;
}

async function convertVisuals(component: FrameNode | InstanceNode) {
  const color = calculateColor();
  const texture = await calculateTexture(component);
  const visible = calculateVisible(component, texture);
  return {
    visible,
    color,
    texture
  };
}

function injectDefaults() {
  const slice9 = vector4(0);
  return {
    ...config.defoldNodeDefaultValues,
    slice9
  };
}

export async function convertToDefoldObject(component: FrameNode | InstanceNode, parentId: string, parentSize: Vector4 | null): Promise<DefoldObjectNode> {
  const defaults = injectDefaults();
  const visuals = await convertVisuals(component);
  const sizeMode = calculateSizeMode(visuals.texture)
  const transformations = convertTransformations(component, parentSize);
  const parent = convertParent(parentId);
  return {
    ...defaults,
    id: component.name,
    ...parent,
    enabled: true,
    ...transformations,
    size_mode: sizeMode,
    ...visuals,
  };
}

async function convertChildrenToDefoldObjectNodes(layer: SceneNode, atRoot: boolean, parentId: string, parentSize: Vector4 | null, defoldObjectNodes: DefoldObjectNode[]) {
  if (layer.visible && (layer.type === "FRAME" || layer.type === "INSTANCE")) {
    if (!atRoot) {
      const defoldObject = await convertToDefoldObject(layer, parentId, parentSize);
      defoldObjectNodes.push(defoldObject); 
    }
    if (layer.children && layer.children.length > 0) {
      const nodeSize = vector4(layer.width, layer.height, 0, 1);
      for (const child of layer.children) {
        const parentId = !atRoot ? layer.name : "";
        await convertChildrenToDefoldObjectNodes(child, false, parentId, nodeSize, defoldObjectNodes);
      }
    }
  }
}

async function convertChildrenToDefoldObjectTextures(node: SceneNode, defoldObjectTextures: DefoldObjectTexture) {
  if (node.type === "FRAME" || node.type === "INSTANCE") {
    if (node.type === "INSTANCE") {
      const mainComponent = await node.getMainComponentAsync();
      if (mainComponent) {
        const componentSet = mainComponent.parent as ComponentSetNode;
        if (isDefoldAtlas(componentSet)) {
          const texture = componentSet.name;
          const path = `/${config.paths.assetsPath}/${config.paths.atlasAssetsPath}/${texture}.atlas`;
          defoldObjectTextures[texture] = path;
        }
      }
    }
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        await convertChildrenToDefoldObjectTextures(child, defoldObjectTextures);
      }
    }
  }
}

function convertToDefoldObjectGUI(): DefoldObjectGUI {
  const backgroundColor = vector4(0);
  return {
    background_color: backgroundColor,
    ...config.defoldGUIDefaultValues,
  };
}

async function convertChildrenToDefoldObject(component: FrameNode | InstanceNode): Promise<DefoldObject> {
  const name = component.name;
  const gui = convertToDefoldObjectGUI();
  const nodes: DefoldObjectNode[] = [];
  await convertChildrenToDefoldObjectNodes(component, true, "", null, nodes);
  const textures: DefoldObjectTexture = {};
  await convertChildrenToDefoldObjectTextures(component, textures);  
  return {
    name,
    gui,
    nodes,
    textures,
  };
}

export async function convertToDefoldObjects(components: FrameNode[]): Promise<DefoldObject[]> {
  const defoldObjects = components.map(convertChildrenToDefoldObject);
  return Promise.all(defoldObjects);
}

function convertToComponentNodeProperty(acc: string, [key, value]: [DefoldObjectNodeKeyType, DefoldObjectNodeValueType]) {
  let result = "";
  if (typeof value === "number" || typeof value === "boolean") {
    result = `${key}: ${value}\n`;
  } else if (typeof value === "string") {
    if (config.defoldNodeConstKeys.includes(key)) {
      result = `${key}: ${value}\n`;
    } else {
      result = `${key}: "${value}"\n`;
    }
  } else if (value) {
    const vector4String = `{\n    x: ${value.x}\n    y: ${value.y}\n    z: ${value.z}\n    w: ${value.w}\n  }`;
    result = `${key} ${vector4String} \n`;
  }
  return `${acc}  ${result}`;
}

function convertObjectToDefoldNodes(acc: string, defoldObjectNode: DefoldObjectNode): string {
  const component = Object.entries(defoldObjectNode).reduce(convertToComponentNodeProperty, "");
  return `${acc}\nnodes\n{\n${component}}`;
}

function convertObjectToDefoldTextures(acc: string, [name, texture]: [string, string]): string {
  return `${acc}\ntextures\n{\n  name: "${name}"\n  texture: "${texture}"\n}`;
}

function convertToComponentGUIProperty(acc: string, [key, value]: [DefoldObjectGUIKeyType, DefoldObjectGUIValueType]) {
  let result: string;
  if (typeof value === "number" || typeof value === "boolean") {
    result = `${key}: ${value} \n`;
  } else if (typeof value === "string") {
    if (config.defoldGUIConstKeys.includes(key)) {
      result = `${key}: ${value} \n`;
    } else {
      const quotedString = `"${value}"`;
      result = `${key}: ${quotedString} \n`;
    }
  } else {
    const vector4String = `{\n    x: ${value.x}\n    y: ${value.y}\n    z: ${value.z}\n    w: ${value.w}\n  }`;
    result = `${key} ${vector4String} \n`;
  }
  return `${acc}${result}`;
}

export function convertToDefoldComponent(defoldObject: DefoldObject): DefoldComponent {
  const gui = Object.entries(defoldObject.gui).reduce(convertToComponentGUIProperty, "");
  const nodes = defoldObject.nodes.reduce(convertObjectToDefoldNodes, "");
  const textures = Object.entries(defoldObject.textures).reduce(convertObjectToDefoldTextures, "")
  return {
    name: defoldObject.name,
    data: `${gui}${textures}${nodes}`
  };
}

export function convertSetToDefoldComponents(defoldObjectsSet: DefoldObject[]): DefoldComponent[] {
  return defoldObjectsSet.map(convertToDefoldComponent);
}
