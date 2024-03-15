import config from "../config/config.json";
import { vector4 } from "./math";

function convertPosition(component: FrameNode) {
  return vector4(component.x, component.y, 0, 1);
}

function convertRotation(component: FrameNode) {
  return vector4(0, 0, component.rotation, 1);
}

function convertScale() {
  return vector4(1);
}

function convertSize(component: FrameNode) {
  return vector4(component.width, component.height, 0, 1);
}

function calculateColor() {
  return vector4(1, 1, 1, 1);
}

function calculateTexture() {
  return "";
}

function injectDefaults() {
  return {
    type: "TYPE_BOX",
    size_mode: "SIZE_MODE_AUTO",
    slice9: vector4(0, 0, 0, 0),
    layer: "",
    inherit_alpha: false,
    xanchor: "XANCHOR_NONE",
    yanchor: "YANCHOR_NONE",
    pivot: "PIVOT_CENTER",
    adjust_mode: "ADJUST_MODE_FIT",
    clipping_mode: "CLIPPING_MODE_NONE",
    clipping_visible: true,
    clipping_inverted: false,
    blend_mode: "BLEND_MODE_ALPHA",
    custom_type: 0,
    template_node_child: false,
  };
}

function convertTransformations(component: FrameNode) {
  return {
    position: convertPosition(component),
    rotation: convertRotation(component),
    scale: convertScale(),
    size: convertSize(component),
  };
}

function convertVisuals() {
  return {
    color: calculateColor(),
    texture: calculateTexture(),
  };
} 

export function convertToDefoldObject(component: FrameNode): DefoldObject {
  return {
    id: component.name,
    enabled: true,
    visible: true,
    ...convertTransformations(component),
    ...convertVisuals(),
    ...injectDefaults(),
  };
}

function generateComponentProperty(key: DefoldObjectKeyType, value: DefoldObjectValueType) {
  return `${key}: ${value}\n`;
}

function convertObjectPropertyToComponentProperty(acc: string, [key, value]: [DefoldObjectKeyType, DefoldObjectValueType]) {
  let result;
  if (typeof value === "number" || typeof value === "boolean") {
    result = generateComponentProperty(key, value);
  } else if (typeof value === "string") {
    if (config.defoldConstKeys.includes(key)) {
      result = generateComponentProperty(key, value);
    } else {
      const quotedString = `"${value}"`;
      result = generateComponentProperty(key, quotedString);
    }
  } else {
    const vector4String = `{\n  x: ${value.x}\n  y: ${value.y}\n  z: ${value.z}\n  w: ${value.w}\n }`;
    result = generateComponentProperty(key, vector4String);
  }
  return `${acc} ${result}`;
}

export function convertToDefoldComponents(object: DefoldObject): string {
  return Object.entries(object).reduce(convertObjectPropertyToComponentProperty, "");
}
