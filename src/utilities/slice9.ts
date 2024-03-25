import { isZeroVector4 } from "utilities/math";
import { getPluginData, isFigmaComponentInstance, isAtlasSprite, setPluginData, isFigmaExportable, isFigmaFrame } from "utilities/figma";

export async function canBeSlice9(layer: SceneNode) {
  if (isFigmaComponentInstance(layer)) {
    return await isAtlasSprite(layer);
  }
  return false;
}

export function isSlice9Layer(layer: SceneNode): layer is InstanceNode {
  return isFigmaComponentInstance(layer) && !!getPluginData(layer, "defoldSlice9");
}

export function isSlice9PlaceholderLayer(layer: BaseNode): layer is FrameNode {
  return layer.name.endsWith("-slice9Placeholder");
}

export function isSlice9ServiceLayer(layer: SceneNode): boolean {
  return layer.name.startsWith("slice9Frame-")
}

export function removeSlice9Placeholder(layer: InstanceNode) {
  const { parent: placeholder } = layer;
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
    }
  }
}

function createSlice9PlaceholderFrame(layer: InstanceNode) {
  const parent = layer.parent;
  const width = layer.width;
  const height = layer.height;
  const positionX = layer.x;
  const positionY = layer.y;
  const placeholder = figma.createFrame();
  parent?.appendChild(placeholder);
  placeholder.x = positionX;
  placeholder.y = positionY;
  placeholder.resize(width, height);
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
    frame.fills = [{ type: "IMAGE", scaleMode: "TILE", imageHash: fillImage.hash }];
    clone.remove();
    placeholder.appendChild(frame);
    frame.name = "slice9Frame-centerTop"
    frame.locked = true;
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
  frame.fills = [{ type: "IMAGE", scaleMode: "TILE", imageHash: fillImage.hash }];
  clone.remove();
  placeholder.appendChild(frame);
  frame.name = "slice9Frame-center"
  frame.locked = true;
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
    frame.fills = [{ type: "IMAGE", scaleMode: "TILE", imageHash: fillImage.hash }];
    clone.remove();
    placeholder.appendChild(frame);
    frame.name = "slice9Frame-centerBottom"
    frame.locked = true;
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
    return frame;
  }
  return null;
}

function createSlice9SliceFrames(placeholder: FrameNode, layer: InstanceNode, slice9: Vector4) {
  const leftTop = createSlice9LeftTopFrame(placeholder, layer, slice9);
  const centerTop = createSlice9CenterTopFrame(placeholder, layer, slice9);
  const rightTop = createSlice9RightTopFrame(placeholder, layer, slice9);
  const leftCenter = createSlice9LeftCenterFrame(placeholder, layer, slice9);
  const center = createSlice9CenterFrame(placeholder, layer, slice9);
  const rightCenter = createSlice9RightCenterFrame(placeholder, layer, slice9);
  const leftBottom = createSlice9LeftBottomFrame(placeholder, layer, slice9);
  const centerBottom = createSlice9CenterBottomFrame(placeholder, layer, slice9);
  const rightBottom = createSlice9RightBottomFrame(placeholder, layer, slice9);
  return {
    leftTop,
    centerTop,
    rightTop,
    leftCenter,
    center,
    rightCenter,
    leftBottom,
    centerBottom,
    rightBottom,
  };
}

export function createSlice9Placeholder(layer: InstanceNode, slice9: Vector4) {
  const placeholder = createSlice9PlaceholderFrame(layer);
  createSlice9SliceFrames(placeholder, layer, slice9);
  placeholder.name = `${layer.name}-slice9Placeholder`;
  layer.x = 0;
  layer.y = 0;
  layer.visible = false;
  layer.locked = true;
  setPluginData(layer, { defoldSlice9: true });
}

export function updateSlice9Placeholder(layer: InstanceNode, slice9: Vector4) {
  removeSlice9Placeholder(layer);
  createSlice9Placeholder(layer, slice9);
}

export async function refreshSlice9Placeholder(layer: SceneNode, slice9: Vector4 | undefined) {
  if (slice9) {
    if (isSlice9Layer(layer)) {
      if (isZeroVector4(slice9)) {
        removeSlice9Placeholder(layer);
      } else {
        updateSlice9Placeholder(layer, slice9);
      }
    } else if (!isZeroVector4(slice9) && isFigmaComponentInstance(layer) && await canBeSlice9(layer)) {
      createSlice9Placeholder(layer, slice9);
    }
  }
}

function checkOriginalLayer(layer: SceneNode): layer is ExportableLayer{
  return !!getPluginData(layer, "defoldSlice9") && isFigmaExportable(layer)
}

export function findOriginalLayer(placeholder: FrameNode): ExportableLayer {
  const { children } = placeholder;
  const layer = children.find(checkOriginalLayer);
  if (!layer) {
    throw new Error("Original layer not found");
  }
  return layer;
}

export function findPlaceholderLayer(layer: ExportableLayer): FrameNode {
  const { parent: placeholder } = layer;
  if (!placeholder || !isFigmaFrame(placeholder)) {
    throw new Error("Placeholder layer not found");
  }
  return placeholder;
}