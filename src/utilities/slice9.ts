/**
 * Handles operations with selection in Figma.
 * @module ScalePlaceholderUtils
 */

import { resolvePluginDataKey } from "utilities/data";
import { getPluginData, hasChildren, isFigmaBox, isFigmaComponentInstance, isLayerExportable, isLayerGameObject, isLayerGUINode, isLayerSprite, removePluginData, setPluginData } from "utilities/figma";
import { getGameObjectPluginData } from "utilities/gameCollection";
import { getGUINodePluginData } from "utilities/gui";
import { inferSizeMode } from "utilities/inference";
import { areVectorsEqual, isZeroVector, vector4 } from "utilities/math";
import { updateGUINode } from "handoff/gui";
import { updateGameObject } from "handoff/gameCollection";

/**
 * Determines whether a Figma layer is a slice9 layer.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is a slice9 layer, false otherwise.
 */
export function isSlice9Layer(layer: SceneNode): layer is InstanceNode {
  return isFigmaComponentInstance(layer) && !!getPluginData(layer, "defoldSlice9");
}

/**
 * Determines whether a Figma layer is a slice9 placeholder frame by its name.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is a slice9 placeholder frame, false otherwise.
 */
export function isSlice9PlaceholderLayer(layer: BaseNode): layer is FrameNode {
  return layer.name.endsWith("-slice9Placeholder");
}

/**
 * Checks if a Figma layer is a slice9 service frame by its name.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is a slice9 service frame, false otherwise.
 */
export function isSlice9ServiceLayer(layer: SceneNode): layer is FrameNode {
  return layer.name.startsWith("slice9Frame-")
}

/**
 * Checks if a Figma layer is a slice9 service left top frame by its name.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is a slice9 service left top layer, false otherwise.
 */
function isSlice9ServiceLeftTopLayer(layer: SceneNode): layer is FrameNode {
  return layer.name.endsWith("leftTop")
}

/**
 * Checks if a Figma layer is a slice9 service center top frame by its name.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is a slice9 service center top frame, false otherwise.
 */
function isSlice9ServiceCenterTopLayer(layer: SceneNode): layer is FrameNode {
  return layer.name.endsWith("centerTop")
}

/**
 * Checks if a Figma layer is a slice9 service right top frame by its name.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is a slice9 service right top frame, false otherwise.
 */
function isSlice9ServiceRightTopLayer(layer: SceneNode): layer is FrameNode {
  return layer.name.endsWith("rightTop")
}

/**
 * Checks if a Figma layer is a slice9 service left center frame by its name.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is a slice9 service left center frame, false otherwise.
 */
function isSlice9ServiceLeftCenterLayer(layer: SceneNode): layer is FrameNode {
  return layer.name.endsWith("leftCenter")
}

/**
 * Checks if a Figma layer is a slice9 service center frame by its name.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is a slice9 service center frame, false otherwise.
 */
function isSlice9ServiceRightCenterLayer(layer: SceneNode): layer is FrameNode {
  return layer.name.endsWith("rightCenter")
}

/**
 * Checks if a Figma layer is a slice9 service left bottom frame by its name.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is a slice9 service left bottom frame, false otherwise.
 */
function isSlice9ServiceLeftBottomLayer(layer: SceneNode): layer is FrameNode {
  return layer.name.endsWith("leftBottom")
}

/**
 * Checks if a Figma layer is a slice9 service center bottom frame by its name.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is a slice9 service center bottom frame, false otherwise.
 */
function isSlice9ServiceCenterBottomLayer(layer: SceneNode): layer is FrameNode {
  return layer.name.endsWith("centerBottom")
}

/**
 * Checks if a Figma layer is a slice9 service right bottom frame by its name.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is a slice9 service right bottom frame, false otherwise.
 */
function isSlice9ServiceRightBottomLayer(layer: SceneNode): layer is FrameNode {
  return layer.name.endsWith("rightBottom")
}

/**
 * Locates the original layer corresponding to a slice9 placeholder frame.
 * @param placeholder - The slice9 placeholder frame to find the original layer for.
 * @returns The original layer if found.
 */
export function findSlice9Layer(placeholder: FrameNode): WithNull<InstanceNode> {
  const { children } = placeholder;
  const layer = children.find(isSlice9Layer);
  if (layer) {
    return layer;
  }
  return null;
}

/**
 * Locates the placeholder frame corresponding to a slice9 layer.
 * @param layer - The layer to find the placeholder for.
 * @returns The placeholder layer if found.
 */
export function findSlice9PlaceholderLayer(layer: ExportableLayer): WithNull<FrameNode> {
  const { parent: placeholder } = layer;
  if (placeholder && isSlice9PlaceholderLayer(placeholder)) {
    return placeholder;
  }
  return null;
}

/**
 * Creates a slice9 placeholder for a layer with specified slice9 values.
 * @param layer - The layer to create the placeholder for.
 * @param slice9 - The slice9 values.
 * @returns The created slice9 placeholder frame.
 */
export async function createSlice9Placeholder(layer: InstanceNode, slice9: Vector4) {
  const placeholder = createSlice9PlaceholderFrame(layer);
  await createSlice9ServiceFrames(placeholder, layer, slice9);
  layer.x = 0;
  layer.y = 0;
  layer.visible = false;
  layer.locked = true;
  setPluginData(layer, { defoldSlice9: true });
  return placeholder;
}

/**
 * Creates a slice9 placeholder frame for a layer.
 * @param layer - The layer to create the placeholder for.
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
 * Creates slice9 service frames for a slice9 placeholder frame.
 * @param placeholder - The slice9 placeholder frame.
 * @param layer - The layer to create the slice for.
 * @param slice9 - The slice9 values.
 */
async function createSlice9ServiceFrames(placeholder: FrameNode, layer: InstanceNode, slice9: Vector4) {
  const promises = [
    createSlice9LeftTopServiceFrame(placeholder, layer, slice9),
    createSlice9CenterTopServiceFrame(placeholder, layer, slice9),
    createSlice9RightTopServiceFrame(placeholder, layer, slice9),
    createSlice9LeftCenterServiceFrame(placeholder, layer, slice9),
    createSlice9CenterServiceFrame(placeholder, layer, slice9),
    createSlice9RightCenterServiceFrame(placeholder, layer, slice9),
    createSlice9LeftBottomServiceFrame(placeholder, layer, slice9),
    createSlice9CenterBottomServiceFrame(placeholder, layer, slice9),
    createSlice9RightBottomServiceFrame(placeholder, layer, slice9),
  ]
  await Promise.all(promises);
}

/**
 * Creates a slice9 service frame for the left top slice.
 * @param placeholder - The slice9 placeholder frame.
 * @param layer - The layer to create the slice for.
 * @param slice9 - The slice9 values.
 * @returns The created slice9 service layer.
 */
async function createSlice9LeftTopServiceFrame(placeholder: FrameNode, layer: InstanceNode, slice9: Vector4) {
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
 * Creates a slice9 service frame for the center top slice.
 * @param placeholder - The slice9 placeholder frame.
 * @param layer - The layer to create the slice for.
 * @param slice9 - The slice9 values.
 * @returns The created slice9 service layer.
 */
async function createSlice9CenterTopServiceFrame(placeholder: FrameNode, layer: InstanceNode, slice9: Vector4) {
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
 * Creates a slice9 service frame for the right top slice.
 * @param placeholder - The slice9 placeholder frame.
 * @param layer - The layer to create the slice for.
 * @param slice9 - The slice9 values.
 * @returns The created slice9 service layer.
 */
async function createSlice9RightTopServiceFrame(placeholder: FrameNode, layer: InstanceNode, slice9: Vector4) {
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
 * Creates a slice9 service frame for the left center slice.
 * @param placeholder - The slice9 placeholder frame.
 * @param layer - The layer to create the slice for.
 * @param slice9 - The slice9 values.
 * @returns The created slice9 service layer.
 */
async function createSlice9LeftCenterServiceFrame(placeholder: FrameNode, layer: InstanceNode, slice9: Vector4) {
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
 * Creates a slice9 service frame for the center slice.
 * @param placeholder - The slice9 placeholder frame.
 * @param layer - The layer to create the slice for.
 * @param slice9 - The slice9 values.
 * @returns The created slice9 service layer.
 */
async function createSlice9CenterServiceFrame(placeholder: FrameNode, layer: InstanceNode, slice9: Vector4) {
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
 * Creates a slice9 service frame for the right center slice.
 * @param placeholder - The slice9 placeholder frame.
 * @param layer - The layer to create the slice for.
 * @param slice9 - The slice9 values.
 * @returns The created slice9 service layer.
 */
async function createSlice9RightCenterServiceFrame(placeholder: FrameNode, layer: InstanceNode, slice9: Vector4) {
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
 * Creates a slice9 service frame for the left bottom slice.
 * @param placeholder - The slice9 placeholder frame.
 * @param layer - The layer to create the slice for.
 * @param slice9 - The slice9 values.
 * @returns The created slice9 service layer.
 */
async function createSlice9LeftBottomServiceFrame(placeholder: FrameNode, layer: InstanceNode, slice9: Vector4) {
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
 * Creates a slice9 service frame for the center bottom slice.
 * @param placeholder - The slice9 placeholder frame.
 * @param layer - The layer to create the slice for.
 * @param slice9 - The slice9 values.
 * @returns The created slice9 service layer.
 */
async function createSlice9CenterBottomServiceFrame(placeholder: FrameNode, layer: InstanceNode, slice9: Vector4) {
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
 * Creates a slice9 service frame for the right bottom slice.
 * @param placeholder - The slice9 placeholder frame.
 * @param layer - The layer to create the slice for.
 * @param slice9 - The slice9 values.
 * @returns The created slice9 service layer.
 */
async function createSlice9RightBottomServiceFrame(placeholder: FrameNode, layer: InstanceNode, slice9: Vector4) {
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
 * Attempts to refresh the slice9 layer.
 * @param layer - The layer to try to refresh.
 */
export async function tryRefreshSlice9(layer: InstanceNode) {
  const pluginDataKey = resolvePluginDataKey(layer);
  if (pluginDataKey) {
    const pluginData = getPluginData(layer, pluginDataKey);
    if (pluginData) {
      const { slice9 } = pluginData;
      await tryRefreshSlice9Placeholder(layer, slice9);
    }
  }
}

/**
 * Attempts to refresh the slice9 placeholder.
 * @param layer - The layer to try to refresh the slice9 placeholder for.
 * @param slice9 - The slice9 values.
 * @param oldSlice9 - The old slice9 values.
 */
export async function tryRefreshSlice9Placeholder(layer: ExportableLayer, slice9?: Vector4, oldSlice9?: Vector4) {
  if (isFigmaComponentInstance(layer) && shouldRefreshSlice9Placeholder(slice9, oldSlice9)) {
    refreshSlice9Placeholder(layer, slice9);
  }
}

/**
 * Determines if the slice9 placeholder should be refreshed.
 * @param slice9 - The new slice9 values.
 * @param oldSlice9 - The old slice9 values.
 * @returns True if the slice9 placeholder should be refreshed, false otherwise.
 */
function shouldRefreshSlice9Placeholder(slice9?: Vector4, oldSlice9?: Vector4): slice9 is Vector4 {
  return !!slice9 && (!oldSlice9 || !areVectorsEqual(oldSlice9, slice9))
}

/**
 * Refreshes the slice9 placeholder for a layer with new slice9 values.
 * @param layer - The layer to refresh the slice9 placeholder for.
 * @param slice9 - The new slice9 values.
 */
async function refreshSlice9Placeholder(layer: InstanceNode, slice9: Vector4) {
  if (isSlice9Layer(layer)) {
    if (isZeroVector(slice9)) {
      removeSlice9Placeholder(layer);
    } else {
      updateSlice9Placeholder(layer, slice9);
    }
  } else if (!isZeroVector(slice9) && await isLayerSprite(layer)) {
    createSlice9Placeholder(layer, slice9);
  }
}

/**
 * Removes the slice9 placeholder and associated slice9 service frames.
 * @param layer - The layer to remove the slice9 placeholder for.
 */
async function removeSlice9Placeholder(layer: InstanceNode) {
  const placeholder = findSlice9PlaceholderLayer(layer);
  if (placeholder) {
    const { parent, children } = placeholder;
    if (parent) {
      children.forEach(child => removeSlice9PlaceholderComponentLayer(child, placeholder, parent));
      removePluginData(layer, "defoldSlice9");
      placeholder.remove();
    }
  }
}

/**
 * Removes a slice9 placeholder component layer.
 * @param layer - The layer to remove the slice9 placeholder for.
 * @param placeholder - The slice9 placeholder frame.
 * @param parent - The parent frame of the placeholder.
 */
function removeSlice9PlaceholderComponentLayer(layer: SceneNode, placeholder: FrameNode, parent: BaseNode & ChildrenMixin) {
  if (isSlice9ServiceLayer(layer)) {
    layer.remove();
  } else {
    unwrapSlice9Layer(layer, placeholder, parent);
  }
}

/**
 * Unwraps a slice9 layer from a slice9 placeholder.
 * @param layer - The layer to unwrap.
 * @param placeholder - The slice9 placeholder frame.
 * @param parent - The parent frame of the placeholder.
 */
function unwrapSlice9Layer(layer: SceneNode, placeholder: FrameNode, parent: BaseNode & ChildrenMixin) {
  const { x, y, width, height } = placeholder;
  layer.x = x + (width - layer.width) / 2;
  layer.y = y + (height - layer.height) / 2;
  layer.locked = false;
  layer.visible = true;
  parent.appendChild(layer);
}

/**
 * Updates the slice9 placeholder with new slice9 values.
 * @param layer - The layer to update the slice9 placeholder for.
 * @param slice9 - The new slice9 values.
 */
async function updateSlice9Placeholder(layer: InstanceNode, slice9: Vector4) {
  const placeholder = findSlice9PlaceholderLayer(layer);
  if (placeholder) {
    removeSlice9ServiceFrames(placeholder);
    layer.visible = true;
    await createSlice9ServiceFrames(placeholder, layer, slice9);
    layer.visible = false;
  }
}

/**
 * Removes slice9 service frames from a slice9 placeholder.
 * @param placeholder - The slice9 placeholder frame.
 */
function removeSlice9ServiceFrames(placeholder: FrameNode) {
  const { children } = placeholder;
  children.forEach(tryRemoveSlice9ServiceFrame);
}

/**
 * Attempts to remove a slice9 service frame.
 * @param layer - The layer to try to remove as a slice9 service frame.
 */
function tryRemoveSlice9ServiceFrame(layer: SceneNode) {
  if (isSlice9ServiceLayer(layer)) {
    layer.remove();
  }
}

/**
 * Attempts to restore the slice 9 placeholder for a layer.
 * @param layer - The layer to try restoring slice 9 data for.
 */
export async function tryRestoreSlice9Placeholder(layer: SceneNode, pluginDataKey: "defoldGUINode" | "defoldGameObject") {
  const originalLayer = isSlice9PlaceholderLayer(layer) ? findSlice9Layer(layer) : layer;
  if (originalLayer && isSlice9Layer(originalLayer)) {
    const slice9 = parseSlice9Data(originalLayer);
    if (slice9) {
      restoreSlice9LayerData(originalLayer, slice9, pluginDataKey);
      await tryRefreshSlice9Placeholder(originalLayer, slice9);
    }
  }
}


/**
 * Attempts to restore slice9 data for a given box layer and its children.
 * @param layer - The Figma layer to try restoring slice 9 data for.
 */
export async function tryRestoreSlice9LayerData(layer: SceneNode, pluginDataKey: "defoldGUINode" | "defoldGameObject") {
  if (isFigmaBox(layer)) {
    if (isSlice9PlaceholderLayer(layer)) {
      const originalLayer = findSlice9Layer(layer);
      if (originalLayer) {
        const slice9 = parseSlice9Data(layer);
        if (slice9) {
          await restoreSlice9LayerData(originalLayer, slice9, pluginDataKey);
        }
      }
    }
    if (hasChildren(layer)) {
      for (const child of layer.children) {
        if (isFigmaBox(child)) {
          await tryRestoreSlice9LayerData(child, pluginDataKey);
        }
      }
    }
  }
}

/**
 * Parses the slice9 data from the provided layer.
 * @param layer - The layer possibly containing the slice9 data.
 * @returns A vector containing the slice9 values, or null if no slice9 data is found.
 */
export function parseSlice9Data(layer: SceneNode): WithNull<Vector4> {
  if (isLayerExportable(layer)) {
    const placeholder = findSlice9PlaceholderLayer(layer);
    if (placeholder) {
      const slice9 = vector4(0);
      const { children } = placeholder;
      for (const child of children) {
        if (isSlice9ServiceLayer(child)) {
          const { x, y, z, w } = parseSlice9LayerData(child);
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
 * Parses the slice9 frame data from the service layer name and dimensions.
 * @param layer - The slice9 service layer.
 * @returns A vector containing the slice9 values.
 */
function parseSlice9LayerData(layer: SceneNode): Vector4 {
  const { width, height } = layer;
  if (isSlice9ServiceLeftTopLayer(layer)) {
    return vector4(width, height, 0, 0);
  } else if (isSlice9ServiceCenterTopLayer(layer)) {
    return vector4(0, height, 0, 0);
  } else if (isSlice9ServiceRightTopLayer(layer)) {
    return vector4(0, height, width, 0);
  } else if (isSlice9ServiceLeftCenterLayer(layer)) {
    return vector4(width, 0, 0, 0);
  } else if (isSlice9ServiceRightCenterLayer(layer)) {
    return vector4(0, 0, width, 0);
  } else if (isSlice9ServiceLeftBottomLayer(layer)) {
    return vector4(width, 0, 0, height);
  } else if (isSlice9ServiceCenterBottomLayer(layer)) {
    return vector4(0, 0, 0, height);
  } else if (isSlice9ServiceRightBottomLayer(layer)) {
    return vector4(0, 0, width, height);
  }
  return vector4(0, 0, 0, 0);
}

/**
 * Restores the slice9 data for a layer.
 * @param layer - The layer to restore the slice9 node for.
 * @param slice9 - The slice9 values.
 * TODO: Refactor to be more generic, abstract and functional
 */
export async function restoreSlice9LayerData(layer: InstanceNode, slice9: Vector4, pluginDataKey: "defoldGUINode" | "defoldGameObject") {
  setPluginData(layer, { defoldSlice9: true });
  if (pluginDataKey === "defoldGUINode") {
    const guiNodeData = getGUINodePluginData(layer);
    const pluginData = { "defoldGUINode": { ...guiNodeData, slice9 } };
    setPluginData(layer, pluginData);
  } else if (pluginDataKey === "defoldGameObject") {
    const gameObjectData = await getGameObjectPluginData(layer);
    const pluginData = { "defoldGameObject": { ...gameObjectData, slice9 } };
    setPluginData(layer, pluginData);
  }
}

/**
 * Attempts to update the original layer name based on the placeholder layer name.
 * @param placeholderLayer - The placeholder layer.
 */
export function tryUpdateSlice9LayerName(placeholderLayer: FrameNode) {
  const layer = findSlice9Layer(placeholderLayer);
  if (layer) {
    updateSlice9LayerName(layer, placeholderLayer);
  }
}

function updateSlice9LayerName(layer: InstanceNode, placeholderLayer: FrameNode) {
  const name = parseSlice9LayerName(placeholderLayer);
  layer.name = name;
}

function parseSlice9LayerName(placeholderLayer: FrameNode) {
  const { name } = placeholderLayer;
  const newName = name.replace("-slice9Placeholder", "");
  return newName;
}

export function tryUpdateSlice9PlaceholderLayerName(layer: InstanceNode) {
  const placeholder = findSlice9PlaceholderLayer(layer);
  if (placeholder) {
    updateSlice9PlaceholderLayerName(placeholder, layer);
  }
}

function updateSlice9PlaceholderLayerName(placeholder: FrameNode, layer: InstanceNode) {
  const name = layer.name;
  placeholder.name = `${name}-slice9Placeholder`;
}

export async function tryRefreshSlice9SizeMode(layer: SceneNode) {
  const originalLayer = isSlice9PlaceholderLayer(layer) ? findSlice9Layer(layer) : layer;
  if (originalLayer && isFigmaBox(originalLayer)) {
    const sizeMode = await inferSizeMode(originalLayer);
    if (isLayerGUINode(originalLayer)) {
      const data = getGUINodePluginData(originalLayer);
      const update = { ...data, size_mode: sizeMode };
      updateGUINode(originalLayer, update);
    } else if (isLayerGameObject(originalLayer)) {
      const data = await getGameObjectPluginData(originalLayer);
      const update = { ...data, size_mode: sizeMode };
      updateGameObject(originalLayer, update);
    }
  }
}