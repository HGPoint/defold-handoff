import { isZeroVector, vector4 } from "utilities/math";
import { getPluginData, removePluginData, isFigmaComponentInstance, isAtlasSprite, setPluginData, isFigmaFrame, isExportable } from "utilities/figma";

export function isSlice9Layer(layer: SceneNode): layer is InstanceNode {
  return isFigmaComponentInstance(layer) && !!getPluginData(layer, "defoldSlice9");
}

export function isSlice9PlaceholderLayer(layer: BaseNode): layer is FrameNode {
  return layer.name.endsWith("-slice9Placeholder");
}

export function isSlice9ServiceLayer(layer: SceneNode): boolean {
  return layer.name.startsWith("slice9Frame-")
}

export function findOriginalLayer(placeholder: FrameNode): ExportableLayer | null {
  const { children } = placeholder;
  const layer = children.find(isSlice9Layer);
  if (!layer) {
    return null;
  }
  return layer;
}

export function findPlaceholderLayer(layer: ExportableLayer): FrameNode | null {
  const { parent: placeholder } = layer;
  if (!placeholder || !isSlice9PlaceholderLayer(placeholder) || !isFigmaFrame(placeholder)) {
    return null;
  }
  return placeholder;
}

function createSlice9PlaceholderFrame(layer: InstanceNode) {
  const parent = layer.parent;
  const width = layer.width;
  const height = layer.height;
  const positionX = layer.x;
  const positionY = layer.y;
  const placeholder = figma.createFrame();
  placeholder.name = `${layer.name}-slice9Placeholder`;
  placeholder.x = positionX;
  placeholder.y = positionY;
  placeholder.resize(width, height);
  placeholder.constraints = { horizontal: "STRETCH", vertical: "STRETCH" };
  placeholder.fills = [];
  parent?.appendChild(placeholder);
  placeholder.appendChild(layer);
  return placeholder;
}

async function createSlice9LeftTopFrame(placeholder: FrameNode, layer: InstanceNode, slice9: Vector4) {
  const { x: left, y: top } = slice9;
  if (left && top) {
    const width = left;
    const height = top;
    const frame = figma.createFrame();
    frame.x = 0;
    frame.y = 0;
    frame.resize(width, height);
    frame.constraints = { horizontal: "MIN", vertical: "MIN" };
    const clone = layer.clone();
    clone.x = 0;
    clone.y = 0;
    frame.appendChild(clone);
    const bytes = await clone.exportAsync({ format: "PNG" });
    const fillImage = figma.createImage(bytes);
    frame.fills = [{ type: "IMAGE", scaleMode: "TILE", imageHash: fillImage.hash }];
    clone.remove();
    placeholder.appendChild(frame);
    frame.name = "slice9Frame-leftTop"
    frame.locked = true;
    return frame;
  }
  return null;
}

async function createSlice9CenterTopFrame(placeholder: FrameNode, layer: InstanceNode, slice9: Vector4) {
  const { x: left, y: top, z: right } = slice9;
  if (top) {
    const width = layer.width - left - right;
    const height = top;
    const frame = figma.createFrame();
    frame.x = left;
    frame.y = 0;
    frame.resize(width, height);
    frame.constraints = { horizontal: "STRETCH", vertical: "MIN" };
    const clone = layer.clone();
    clone.x = (width - layer.width - left + right) / 2;
    clone.y = 0;
    frame.appendChild(clone);
    const bytes = await clone.exportAsync({ format: "PNG" });
    const fillImage = figma.createImage(bytes);
    frame.fills = [{ type: "IMAGE", scaleMode: "CROP", imageHash: fillImage.hash }];
    clone.remove();
    placeholder.appendChild(frame);
    frame.name = "slice9Frame-centerTop"
    frame.locked = true;
    const frameWidth = placeholder.width - left - right;
    frame.resize(frameWidth, height);
    return frame;
  }
  return null;
}

async function createSlice9RightTopFrame(placeholder: FrameNode, layer: InstanceNode, slice9: Vector4) {
  const { z: right, y: top } = slice9;
  if (right && top) {
    const width = right;
    const height = top; 
    const frame = figma.createFrame();
    frame.resize(width, height);
    frame.x = layer.width - right;
    frame.y = 0;
    frame.constraints = { horizontal: "MAX", vertical: "MIN" };
    const clone = layer.clone();
    clone.x = width - layer.width;
    clone.y = 0;
    frame.appendChild(clone);
    const bytes = await clone.exportAsync({ format: "PNG" });
    const fillImage = figma.createImage(bytes);
    frame.fills = [{ type: "IMAGE", scaleMode: "TILE", imageHash: fillImage.hash }];
    clone.remove();
    placeholder.appendChild(frame);
    frame.name = "slice9Frame-rightTop"
    frame.locked = true;
    const frameX = placeholder.width - right;
    frame.x = frameX;
    return frame;
  }
  return null;
}

async function createSlice9LeftCenterFrame(placeholder: FrameNode, layer: InstanceNode, slice9: Vector4) {
  const { x: left, y: top, w: bottom } = slice9;
  if (left) {
    const width = left;
    const height = layer.height - top - bottom;
    const frame = figma.createFrame();
    frame.resize(width, height);
    frame.x = 0;
    frame.y = top;
    frame.constraints = { horizontal: "MIN", vertical: "STRETCH" };
    const clone = layer.clone();
    clone.x = 0;
    clone.y = (height - layer.height - top + bottom) / 2;
    frame.appendChild(clone);
    const bytes = await clone.exportAsync({ format: "PNG" });
    const fillImage = figma.createImage(bytes);
    frame.fills = [{ type: "IMAGE", scaleMode: "TILE", imageHash: fillImage.hash }];
    clone.remove();
    placeholder.appendChild(frame);
    frame.name = "slice9Frame-leftCenter"
    frame.locked = true;
    const frameHeight = placeholder.height - top - bottom;
    frame.resize(width, frameHeight);
    return frame;
  }
  return null;
}

async function createSlice9CenterFrame(placeholder: FrameNode, layer: InstanceNode, slice9: Vector4) {
  const { x: left, y: top, z: right, w: bottom } = slice9;
  const width = layer.width - left - right;
  const height = layer.height - top - bottom;
  const frame = figma.createFrame();
  frame.resize(width, height);
  frame.x = left;
  frame.y = top;
  frame.constraints = { horizontal: "STRETCH", vertical: "STRETCH" };
  const clone = layer.clone();
  clone.x = (width - layer.width - left + right) / 2;
  clone.y = (height - layer.height - top + bottom) / 2;
  frame.appendChild(clone);
  const bytes = await clone.exportAsync({ format: "PNG" });
  const fillImage = figma.createImage(bytes);
  frame.fills = [{ type: "IMAGE", scaleMode: "CROP", imageHash: fillImage.hash }];
  clone.remove();
  placeholder.appendChild(frame);
  frame.name = "slice9Frame-center"
  frame.locked = true;
  const frameWidth = placeholder.width - left - right;
  const frameHeight = placeholder.height - top - bottom;
  frame.resize(frameWidth, frameHeight);
  return frame;
}

async function createSlice9RightCenterFrame(placeholder: FrameNode, layer: InstanceNode, slice9: Vector4) {
  const { z: right, y: top, w: bottom } = slice9;
  if (right) {
    const width = right;
    const height = layer.height - top - bottom;
    const frame = figma.createFrame();
    frame.resize(width, height);
    frame.x = layer.width - right;
    frame.y = top;
    frame.constraints = { horizontal: "MAX", vertical: "STRETCH" };
    const clone = layer.clone();
    clone.x = width - layer.width;
    clone.y = (height - layer.height - top + bottom) / 2;
    frame.appendChild(clone);
    const bytes = await clone.exportAsync({ format: "PNG" });
    const fillImage = figma.createImage(bytes);
    frame.fills = [{ type: "IMAGE", scaleMode: "TILE", imageHash: fillImage.hash }];
    clone.remove();
    placeholder.appendChild(frame);
    frame.name = "slice9Frame-rightCenter"
    frame.locked = true;
    const frameHeight = placeholder.height - top - bottom;
    const frameX = placeholder.width - right;
    frame.resize(width, frameHeight);
    frame.x = frameX;
    return frame;
  }
  return null;
}

async function createSlice9LeftBottomFrame(placeholder: FrameNode, layer: InstanceNode, slice9: Vector4) {
  const { x: left, w: bottom } = slice9;
  if (left && bottom) {
    const width = left;
    const height = bottom;
    const frame = figma.createFrame();
    frame.resize(width, height);
    frame.x = 0;
    frame.y = layer.height - bottom;
    frame.constraints = { horizontal: "MIN", vertical: "MAX" };
    const clone = layer.clone();
    clone.x = 0;
    clone.y = height - layer.height;
    frame.appendChild(clone);
    const bytes = await clone.exportAsync({ format: "PNG" });
    const fillImage = figma.createImage(bytes);
    frame.fills = [{ type: "IMAGE", scaleMode: "TILE", imageHash: fillImage.hash }];
    clone.remove();
    placeholder.appendChild(frame);
    frame.name = "slice9Frame-leftBottom"
    frame.locked = true;
    const frameY = placeholder.height - bottom;
    frame.y = frameY;
    return frame;
  }
  return null;
}

async function createSlice9CenterBottomFrame(placeholder: FrameNode, layer: InstanceNode, slice9: Vector4) {
  const { x: left, z: right, w: bottom } = slice9;
  if (bottom) {
    const width = layer.width - left - right;
    const height = bottom;
    const frame = figma.createFrame();
    frame.resize(width, height);
    frame.x = left;
    frame.y = layer.height - bottom;
    frame.constraints = { horizontal: "STRETCH", vertical: "MAX" };
    const clone = layer.clone();
    clone.x = (width - layer.width - left + right) / 2;
    clone.y = height - layer.height;
    frame.appendChild(clone);
    const bytes = await clone.exportAsync({ format: "PNG" });
    const fillImage = figma.createImage(bytes);
    frame.fills = [{ type: "IMAGE", scaleMode: "CROP", imageHash: fillImage.hash }];
    clone.remove();
    placeholder.appendChild(frame);
    frame.name = "slice9Frame-centerBottom"
    frame.locked = true;
    const frameWidth = placeholder.width - left - right;
    const frameY = placeholder.height - bottom;
    frame.resize(frameWidth, height);
    frame.y = frameY;
    return frame;
  }
  return null;
}

async function createSlice9RightBottomFrame(placeholder: FrameNode, layer: InstanceNode, slice9: Vector4) {
  const { z: right, w: bottom } = slice9;
  if (right && bottom) {
    const width = right;
    const height = bottom;
    const frame = figma.createFrame();
    frame.resize(width, height);
    frame.x = layer.width - right;
    frame.y = layer.height - bottom;
    frame.constraints = { horizontal: "MAX", vertical: "MAX" };
    const clone = layer.clone();
    clone.x = width - layer.width;
    clone.y = height - layer.height;
    frame.appendChild(clone);
    const bytes = await clone.exportAsync({ format: "PNG" });
    const fillImage = figma.createImage(bytes);
    frame.fills = [{ type: "IMAGE", scaleMode: "TILE", imageHash: fillImage.hash }];
    clone.remove();
    placeholder.appendChild(frame);
    frame.name = "slice9Frame-rightBottom"
    frame.locked = true;
    const frameX = placeholder.width - right;
    const frameY = placeholder.height - bottom;
    frame.x = frameX;
    frame.y = frameY;
    return frame;
  }
  return null;
}

async function createSlice9SliceFrames(placeholder: FrameNode, layer: InstanceNode, slice9: Vector4) {
  await createSlice9LeftTopFrame(placeholder, layer, slice9);
  await createSlice9CenterTopFrame(placeholder, layer, slice9);
  await createSlice9RightTopFrame(placeholder, layer, slice9);
  await createSlice9LeftCenterFrame(placeholder, layer, slice9);
  await createSlice9CenterFrame(placeholder, layer, slice9);
  await createSlice9RightCenterFrame(placeholder, layer, slice9);
  await createSlice9LeftBottomFrame(placeholder, layer, slice9);
  await createSlice9CenterBottomFrame(placeholder, layer, slice9);
  await createSlice9RightBottomFrame(placeholder, layer, slice9);
}

function removeSlice9SliceFrames(placeholder: FrameNode) {
  const { children } = placeholder;
  for (const layer of children) {
    if (isSlice9ServiceLayer(layer)) {
      layer.remove();
    }
  }
}

export async function createSlice9Placeholder(layer: InstanceNode, slice9: Vector4) {
  const placeholder = createSlice9PlaceholderFrame(layer);
  await createSlice9SliceFrames(placeholder, layer, slice9);
  layer.x = 0;
  layer.y = 0;
  layer.visible = false;
  layer.locked = true;
  setPluginData(layer, { defoldSlice9: true });
}

export function removeSlice9Placeholder(layer: InstanceNode) {
  const placeholder = findPlaceholderLayer(layer);
  if (placeholder && isSlice9PlaceholderLayer(placeholder)) {
    const { parent, children } = placeholder;
    if (parent) {
      const { x, y, width, height } = placeholder;
      for (const layer of children) {
        if (isSlice9ServiceLayer(layer)) {
          layer.remove();
        } else {
          layer.x = x + (width - layer.width) / 2;
          layer.y = y + (height - layer.height) / 2;
          layer.locked = false;
          layer.visible = true;
          parent.appendChild(layer);
        }
      }
      placeholder.remove();
      removePluginData(layer, "defoldSlice9");
    }
  }
}

export async function updateSlice9Placeholder(layer: InstanceNode, slice9: Vector4) {
  const placeholder = findPlaceholderLayer(layer);
  if (placeholder && isSlice9PlaceholderLayer(placeholder)) {
    removeSlice9SliceFrames(placeholder);
    layer.visible = true;
    await createSlice9SliceFrames(placeholder, layer, slice9);
    layer.visible = false;
  }
}

export async function tryRefreshSlice9Placeholder(layer: SceneNode, slice9: Vector4 | undefined) {
  if (slice9) {
    if (isSlice9Layer(layer)) {
      if (isZeroVector(slice9)) {
        removeSlice9Placeholder(layer);
      } else {
        updateSlice9Placeholder(layer, slice9);
      }
    } else if (!isZeroVector(slice9) && isFigmaComponentInstance(layer) && await isAtlasSprite(layer)) {
      createSlice9Placeholder(layer, slice9);
    }
  }
}

export async function tryRefreshSlice9Sprite(layer: SceneNode) {
  const pluginData = getPluginData(layer, "defoldGUINode");
  if (pluginData) {
    await tryRefreshSlice9Placeholder(layer, pluginData.slice9);
  }
}

function parseSlice9FrameData(layer: SceneNode): Vector4 {
  const { width, height, name } = layer;
  if (name.endsWith("leftTop")) {
    return vector4(width, height, 0, 0);
  } else if (name.endsWith("centerTop")) {
    return vector4(0, height, 0, 0);
  } else if (name.endsWith("rightTop")) {
    return vector4(0, height, width, 0);
  } else if (name.endsWith("leftCenter")) {
    return vector4(width, 0, 0, 0);
  } else if (name.endsWith("rightCenter")) {
    return vector4(0, 0, width, 0);
  } else if (name.endsWith("leftBottom")) {
    return vector4(width, 0, 0, height);
  } else if (name.endsWith("centerBottom")) {
    return vector4(0, 0, 0, height);
  } else if (name.endsWith("rightBottom")) {
    return vector4(0, 0, width, height);
  }
  return vector4(0, 0, 0, 0);
}

export function parseSlice9Data(layer: SceneNode): Vector4 | null {
  if (isExportable(layer)) {
    const placeholder = findPlaceholderLayer(layer);
    if (placeholder) {
      const slice9 = vector4(0);
      const { children } = placeholder;
      for (const child of children) {
        if (isSlice9ServiceLayer(child)) {
          const { x, y, z, w } = parseSlice9FrameData(child);
          slice9.x = x || slice9.x;
          slice9.y = y || slice9.y;
          slice9.z = z || slice9.z;
          slice9.w = w || slice9.w;
        }
      }
      return slice9;
    }
  }
  return null;
}
