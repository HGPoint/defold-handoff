/**
 * Utility module for handling slice9 placeholders in Figma.
 * @module ScalePlaceholderUtils
 */

import { selectNode } from "utilities/figma";
import { isZeroVector, areVectorsEqual, vector4 } from "utilities/math";
import { getPluginData, removePluginData, isFigmaComponentInstance, isAtlasSprite, setPluginData, isFigmaFrame, isExportable } from "utilities/figma";
import { getDefoldGUINodePluginData } from "utilities/gui";

/**
 * Checks if a Figma layer has the specified plugin data indicating it is a slice9 layer.
 * @param layer - The Figma layer to check.
 * @returns A boolean indicating if the layer is a slice9 layer.
 */
export function isSlice9Layer(layer: SceneNode) {
  return isFigmaComponentInstance(layer) && !!getPluginData(layer, "defoldSlice9");
}

/**
 * Checks if a layer is a slice9 placeholder layer.
 * @param layer - The layer to check.
 * @returns True if the layer is a slice9 placeholder layer, false otherwise.
 */
export function isSlice9PlaceholderLayer(layer: BaseNode): layer is FrameNode {
  return layer.name.endsWith("-slice9Placeholder");
}

/**
 * Checks if a layer is a slice9 service layer.
 * @param layer - The layer to check.
 * @returns True if the layer is a slice9 service layer, false otherwise.
 */
export function isSlice9ServiceLayer(layer: SceneNode): boolean {
  return layer.name.startsWith("slice9Frame-")
}

function isOriginalSlice9Layer(layer: SceneNode): layer is InstanceNode {
  return isFigmaComponentInstance(layer) && isSlice9Layer(layer);
}

/**
 * Finds the original layer corresponding to a slice9 placeholder.
 * @param placeholder - The slice9 placeholder layer.
 * @returns The original layer if found, otherwise null.
 */
export function findOriginalLayer(placeholder: FrameNode): ExportableLayer | null {
  const { children } = placeholder;
  const layer = children.find(isOriginalSlice9Layer);
  if (!layer) {
    return null;
  }
  return layer;
}

/**
 * Finds the placeholder layer corresponding to a slice9 layer.
 * @param layer - The layer to find the placeholder for.
 * @returns The placeholder layer if found, otherwise null.
 */
export function findPlaceholderLayer(layer: ExportableLayer): FrameNode | null {
  const { parent: placeholder } = layer;
  if (!placeholder || !isSlice9PlaceholderLayer(placeholder) || !isFigmaFrame(placeholder)) {
    return null;
  }
  return placeholder;
}

/**
 * Creates a slice9 placeholder frame for a layer.
 * @param layer - The layer for which to create the placeholder.
 * @returns The created placeholder frame.
 */
function createSlice9PlaceholderFrame(layer: InstanceNode) {
  const parent = layer.parent;
  const hierarchyPosition = parent ? parent.children.indexOf(layer) : 0;
  const absolutePosition = layer.layoutPositioning === "ABSOLUTE";
  const width = layer.width;
  const height = layer.height;
  const positionX = layer.x;
  const positionY = layer.y;
  const placeholder = figma.createFrame();
  placeholder.name = `${layer.name}-slice9Placeholder`;
  placeholder.x = positionX;
  placeholder.y = positionY;
  placeholder.resizeWithoutConstraints(width, height);
  placeholder.constraints = { horizontal: "STRETCH", vertical: "STRETCH" };
  placeholder.fills = [];
  parent?.insertChild(hierarchyPosition, placeholder);
  placeholder.layoutPositioning = absolutePosition ? "ABSOLUTE" : "AUTO";
  placeholder.appendChild(layer);
  layer.constraints = { horizontal: "MIN", vertical: "MIN" };
  return placeholder
}

/**
 * Creates a slice9 service layer for the left top slice.
 * @param placeholder - The slice9 placeholder frame.
 * @param layer - The layer to create the slice for.
 * @param slice9 - The slice9 values.
 * @returns The created slice9 service layer.
 */
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

/**
 * Creates a slice9 service layer for the center top slice.
 * @param placeholder - The slice9 placeholder frame.
 * @param layer - The layer to create the slice for.
 * @param slice9 - The slice9 values.
 * @returns The created slice9 service layer.
 */
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

/**
 * Creates a slice9 service layer for the right top slice.
 * @param placeholder - The slice9 placeholder frame.
 * @param layer - The layer to create the slice for.
 * @param slice9 - The slice9 values.
 * @returns The created slice9 service layer.
 */
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

/**
 * Creates a slice9 service layer for the left center slice.
 * @param placeholder - The slice9 placeholder frame.
 * @param layer - The layer to create the slice for.
 * @param slice9 - The slice9 values.
 * @returns The created slice9 service layer.
 */
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

/**
 * Creates a slice9 service layer for the center slice.
 * @param placeholder - The slice9 placeholder frame.
 * @param layer - The layer to create the slice for.
 * @param slice9 - The slice9 values.
 * @returns The created slice9 service layer.
 */
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

/**
 * Creates a slice9 service layer for the right center slice.
 * @param placeholder - The slice9 placeholder frame.
 * @param layer - The layer to create the slice for.
 * @param slice9 - The slice9 values.
 * @returns The created slice9 service layer.
 */
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

/**
 * Creates a slice9 service layer for the left bottom slice.
 * @param placeholder - The slice9 placeholder frame.
 * @param layer - The layer to create the slice for.
 * @param slice9 - The slice9 values.
 * @returns The created slice9 service layer.
 */
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

/**
 * Creates a slice9 service layer for the center bottom slice.
 * @param placeholder - The slice9 placeholder frame.
 * @param layer - The layer to create the slice for.
 * @param slice9 - The slice9 values.
 * @returns The created slice9 service layer.
 */
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

/**
 * Creates a slice9 service layer for the right bottom slice.
 * @param placeholder - The slice9 placeholder frame.
 * @param layer - The layer to create the slice for.
 * @param slice9 - The slice9 values.
 * @returns The created slice9 service layer.
 */
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

/**
 * Creates slice9 service layers for a slice9 placeholder.
 * @param placeholder - The slice9 placeholder frame.
 * @param layer - The layer to create the slice for.
 * @param slice9 - The slice9 values.
 */
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

/**
 * Removes slice9 service layers from a slice9 placeholder.
 * @param placeholder - The slice9 placeholder frame.
 */
function removeSlice9SliceFrames(placeholder: FrameNode) {
  const { children } = placeholder;
  for (const layer of children) {
    if (isSlice9ServiceLayer(layer)) {
      layer.remove();
    }
  }
}

/**
 * Creates a slice9 placeholder for a layer with specified slice9 values.
 * @param layer - The layer to create the placeholder for.
 * @param slice9 - The slice9 values.
 */
export async function createSlice9Placeholder(layer: InstanceNode, slice9: Vector4) {
  const placeholder = createSlice9PlaceholderFrame(layer);
  await createSlice9SliceFrames(placeholder, layer, slice9);
  layer.x = 0;
  layer.y = 0;
  layer.visible = false;
  layer.locked = true;
  setPluginData(layer, { defoldSlice9: true });
  selectNode([placeholder], true);
}

/**
 * Removes the slice9 placeholder and associated slice9 service layers.
 * @param layer - The layer for which to remove the slice9 placeholder.
 */
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

/**
 * Updates the slice9 placeholder with new slice9 values.
 * @param layer - The layer to update the slice9 placeholder for.
 * @param slice9 - The new slice9 values.
 */
export async function updateSlice9Placeholder(layer: InstanceNode, slice9: Vector4) {
  const placeholder = findPlaceholderLayer(layer);
  if (placeholder && isSlice9PlaceholderLayer(placeholder)) {
    removeSlice9SliceFrames(placeholder);
    layer.visible = true;
    await createSlice9SliceFrames(placeholder, layer, slice9);
    layer.visible = false;
  }
}

/**
 * Attempts to refresh the slice9 placeholder.
 * @param layer - The layer for which to refresh the slice9 placeholder.
 * @param slice9 - The slice9 data.
 * @param oldSlice9 - The old slice9 data.
 */
export async function tryRefreshSlice9Placeholder(layer: SceneNode, slice9?: Vector4, oldSlice9?: Vector4) {
  if (slice9 && (!oldSlice9 || !areVectorsEqual(oldSlice9, slice9))) {
    if (isSlice9Layer(layer) && isFigmaComponentInstance(layer)) {
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

/**
 * Attempts to refresh the base sprite for a slice9 placeholder.
 * @param layer - The sprite layer for which to refresh the slice9 placeholder.
 */
export async function tryRefreshSlice9Sprite(layer: SceneNode) {
  const pluginData = getPluginData(layer, "defoldGUINode");
  if (pluginData) {
    await tryRefreshSlice9Placeholder(layer, pluginData.slice9);
  }
}

/**
 * Parses the slice9 frame data from the service layer name and dimensions.
 * @param layer - The slice9 service layer.
 * @returns A vector containing the slice9 values.
 */
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

/**
 * Parses the slice9 data from the provided layer.
 * @param layer - The layer possibly containing the slice9 data.
 * @returns A vector containing the slice9 values, or null if no slice9 data is found.
 */
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

/**
 * Restores the slice9 data for a layer.
 * @param layer - The layer to restore the slice9 node for.
 * @param slice9 - The slice9 values.
 */
export function restoreSlice9Node(layer: SceneNode, slice9: Vector4) {
  setPluginData(layer, { defoldSlice9: true });
  const data = getDefoldGUINodePluginData(layer);
  setPluginData(layer, { defoldGUINode: { ...data, slice9 } });
}

/**
 * Attempts to update the original layer name based on the placeholder layer name.
 * @param placeholderLayer - The placeholder layer.
 */
export function tryUpdateOriginalLayerName(placeholderLayer: FrameNode) {
  const originalLayer = findOriginalLayer(placeholderLayer);
  if (originalLayer) {
    const { name } = placeholderLayer;
    const newName = name.replace("-slice9Placeholder", "");
    originalLayer.name = newName;
  }
}