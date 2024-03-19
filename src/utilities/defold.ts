import config from "../config/config.json";
import { vector4 } from "./math";
import { isDefoldAtlas } from "../defold/atlas";

function calculateType(component: FrameNode | InstanceNode | TextNode) {
  if (component.type === "TEXT") {
    return "TYPE_TEXT";
  }
  return "TYPE_BOX";

}

function convertParent(parentId: string) {
  return parentId ? { parent: parentId } : {};
}

function convertPosition(component: FrameNode | InstanceNode | TextNode, parentSize: Vector4 | null) {
  if (!parentSize) {
    return vector4(component.x, component.y, 0, 1);
  }
  const x = component.x + (component.width / 2) - (parentSize.x / 2);
  const y = (parentSize.y / 2) - component.y - (component.height / 2);
  return vector4(x, y, 0, 1);
}

function convertRotation(component: FrameNode | InstanceNode | TextNode) {
  return vector4(0, 0, component.rotation, 1);
}

function convertBoxScale() {
  return vector4(1);
}

function convertTextScale(component: TextNode) {
  const { fontSize } = component;
  if (typeof fontSize === "number") {
    const scale = fontSize / config.defoldFontSize;
    return vector4(scale, scale, scale, 1);
  }
  return vector4(1);
}

function convertSize(component: FrameNode | InstanceNode | TextNode) {
  return vector4(component.width, component.height, 0, 1);
}

function calculateSizeMode(texture: string): SizeMode {
  return texture ? "SIZE_MODE_AUTO" : "SIZE_MODE_MANUAL";
}

function convertBoxTransformations(component: FrameNode | InstanceNode | TextNode, parentSize: Vector4 | null) {
  const position = convertPosition(component, parentSize);
  const rotation = convertRotation(component);
  const scale = convertBoxScale();
  const size = convertSize(component);
  return {
    position,
    rotation,
    scale,
    size,
  };
}

function convertTextTransformations(component: TextNode, parentSize: Vector4 | null) {
  const position = convertPosition(component, parentSize);
  const rotation = convertRotation(component);
  const scale = convertTextScale(component);
  const size = convertSize(component);
  return {
    position,
    rotation,
    scale,
    size
  };
}

function calculateColor(component: FrameNode | InstanceNode | TextNode) {
  console.log();
  if (typeof component.fills === "object" && component.fills.length > 0) {
    const [ fill ] = component.fills;
    if (fill.type === "SOLID") {
      const { r, g, b } = fill.color;
      return vector4(r, g, b, fill.opacity);
    }
  }
  return vector4(1);
}

async function calculateTexture(component: FrameNode | InstanceNode | TextNode) {
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

function calculateVisible(component: FrameNode | InstanceNode | TextNode, texture: string) {
  return !!texture || component.type === "TEXT";
}

async function convertBoxVisuals(component: FrameNode | InstanceNode) {
  const color = calculateColor(component);
  const texture = await calculateTexture(component);
  const visible = calculateVisible(component, texture);
  return {
    visible,
    color,
    texture
  };
}

function convertTextVisuals(component: FrameNode | InstanceNode | TextNode) {
  const color = calculateColor(component);
  const visible = true; 
  const font = config.defoldFontFamily;
  const outline = vector4(0);
  const shadow = vector4(0);
  return {
    visible,
    color,
    outline,
    shadow,
    font
  };

}

function injectDefaults() {
  const slice9 = vector4(0);
  return {
    ...config.defoldNodeDefaultValues,
    slice9
  };
}

export async function convertToDefoldBoxObject(component: FrameNode | InstanceNode, parentId: string, parentSize: Vector4 | null): Promise<DefoldObjectNode> {
  const defaults = injectDefaults();
  const type = calculateType(component);
  const visuals = await convertBoxVisuals(component);
  const sizeMode = calculateSizeMode(visuals.texture)
  const transformations = convertBoxTransformations(component, parentSize);
  const parent = convertParent(parentId);
  return {
    ...defaults,
    type,
    id: component.name,
    ...parent,
    enabled: true,
    ...transformations,
    size_mode: sizeMode,
    ...visuals,
  };
}

export function convertToDefoldTextObject(component: TextNode, parentId: string, parentSize: Vector4 | null): DefoldObjectNode {
  const defaults = injectDefaults();
  const type = calculateType(component);
  const visuals = convertTextVisuals(component);
  const transformations = convertTextTransformations(component, parentSize);
  const parent = convertParent(parentId);
  const text = component.characters;
  return {
    ...defaults,
    type,
    id: component.name,
    ...parent,
    enabled: true,
    ...transformations,
    ...visuals,
    text,
  };

}

async function convertChildrenToDefoldObjectNodes(layer: SceneNode, atRoot: boolean, parentId: string, parentSize: Vector4 | null, defoldObjectNodes: DefoldObjectNode[]) {
  if (layer.visible) {
    if (layer.type === "FRAME" || layer.type === "INSTANCE") {
      if (!atRoot) {
        const defoldObject = await convertToDefoldBoxObject(layer, parentId, parentSize);
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
    if (layer.type === "TEXT") {
      const defoldObject = convertToDefoldTextObject(layer, parentId, parentSize);
      defoldObjectNodes.push(defoldObject);
    }
  }
}

async function convertChildrenToDefoldObjectTextures(layer: SceneNode, defoldObjectTextures: DefoldObjectTexture) {
  if (layer.type === "FRAME" || layer.type === "INSTANCE") {
    if (layer.type === "INSTANCE") {
      const mainComponent = await layer.getMainComponentAsync();
      if (mainComponent) {
        const componentSet = mainComponent.parent as ComponentSetNode;
        if (isDefoldAtlas(componentSet)) {
          const texture = componentSet.name;
          const path = `/${config.paths.assetsPath}/${config.paths.atlasAssetsPath}/${texture}.atlas`;
          const id = componentSet.id;
          defoldObjectTextures[texture] = {
            path,
            id
          };
        }
      }
    }
    if (layer.children && layer.children.length > 0) {
      for (const child of layer.children) {
        await convertChildrenToDefoldObjectTextures(child, defoldObjectTextures);
      }
    }
  }
}

async function convertToDefoldObjectFonts(layer: SceneNode, defoldObjectFonts: DefoldObjectFont) {
  if (layer.type === "FRAME" || layer.type === "INSTANCE") {
    if (layer.children && layer.children.length > 0) {
      for (const child of layer.children) {
        await convertToDefoldObjectFonts(child, defoldObjectFonts);
      }
    }
  }
  if (layer.type === "TEXT") {
    const font = config.defoldFontFamily;
    const path = `/${config.paths.assetsPath}/${config.paths.fontAssetsPath}/${font}.font`;
    defoldObjectFonts[font] = path;
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
  const fonts = {};
  await convertToDefoldObjectFonts(component, fonts);
  return {
    name,
    gui,
    nodes,
    textures,
    fonts,
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

function convertObjectToDefoldTextures(acc: string, [name, texture]: [string, DefoldObjectTextureAtlas]): string {
  return `${acc}\ntextures\n{\n  name: "${name}"\n  texture: "${texture.path}"\n}`;
}

function convertObjectToDefoldFonts(acc: string, [name, fontPath]: [string, string]): string {
  return `${acc}\nfonts\n{\n  name: "${name}"\n  font: "${fontPath}"\n}`;
} 

function convertToComponentGUIProperty(acc: string, [key, value]: [DefoldObjectGUIKeyType, DefoldObjectGUIValueType], index: number) {
  let result: string;
  if (typeof value === "number" || typeof value === "boolean") {
    result = `${key}: ${value}`;
  } else if (typeof value === "string") {
    if (config.defoldGUIConstKeys.includes(key)) {
      result = `${key}: ${value}`;
    } else {
      const quotedString = `"${value}"`;
      result = `${key}: ${quotedString}`;
    }
  } else {
    const vector4String = `{\n  x: ${value.x}\n  y: ${value.y}\n  z: ${value.z}\n  w: ${value.w}\n}`;
    result = `${key} ${vector4String}`;
  }
  return index == 0 ? `${acc}${result}` : `${acc}\n${result}`;
}

export function convertToDefoldComponent(defoldObject: DefoldObject): DefoldComponent {
  const gui = Object.entries(defoldObject.gui).reduce(convertToComponentGUIProperty, "");
  const nodes = defoldObject.nodes.reduce(convertObjectToDefoldNodes, "");
  const textures = Object.entries(defoldObject.textures).reduce(convertObjectToDefoldTextures, "")
  const fonts = Object.entries(defoldObject.fonts).reduce(convertObjectToDefoldFonts, "");
  return {
    name: defoldObject.name,
    data: `${gui}${textures}${fonts}${nodes}`
  };
}

export function convertSetToDefoldComponents(defoldObjectsSet: DefoldObject[]): DefoldComponent[] {
  return defoldObjectsSet.map(convertToDefoldComponent);
}
