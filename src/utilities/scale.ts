/**
 * Utility module for handling scale placeholders in Figma.
 * @packageDocumentation
 */

import { getPluginData } from "utilities/figma";
import { areVectorsEqual, isOneScaleVector } from "utilities/math";

/**
 * Checks if a Figma layer has the specified plugin data indicating it has scale transformation.
 * @param layer - The Figma layer to check.
 * @returns A boolean indicating if the layer has scale transformation.
 */
function isScaleLayer(layer: SceneNode) {
  return !!getPluginData(layer, "defoldScale")
}

/**
 * Removes a scale placeholder from the Figma canvas.
 * @param layer - The layer representing the scale placeholder.
 */
function removeScalePlaceholder(layer: SceneNode) {
  console.log(layer.name);
}

/**
 * Updates the scale placeholder with new scale transformation.
 * @param layer - The layer representing the scale placeholder.
 * @param scale - The new scale transformation.
 */
function updateScalePlaceholder(layer: SceneNode, scale: Vector4) {
  console.log(layer.name, scale);
}

/**
 * Creates a frame node representing the scaled version of the layer and attaches it to the placeholder.
 * @param placeholder - The frame node representing the placeholder.
 * @param layer - The layer to be scaled.
 * @param scale - The scale values.
 * @returns The newly created frame node.
 */
async function createScaleFrame(placeholder: FrameNode, layer: SceneNode, scale: Vector4) {
  const width = layer.width * scale.x;
  const height = layer.height * scale.y;
  const frame = figma.createFrame();
  frame.name = `${layer.name}-scaleFrame`;
  frame.x = 0;
  frame.y = 0;
  frame.resize(width, height);
  frame.constraints = { horizontal: "SCALE", vertical: "SCALE" };
  const clone = layer.clone();
  clone.x = 0;
  clone.y = 0;
  placeholder.appendChild(clone);
  const bytes = await clone.exportAsync({ format: "PNG", constraint: { type: "SCALE", value: Math.max(scale.x, scale.y) } });
  const fillImage = figma.createImage(bytes);
  frame.fills = [{ type: "IMAGE", scaleMode: "CROP", imageHash: fillImage.hash }];
  clone.remove();
  placeholder.appendChild(frame);
  return frame;
}

/**
 * Creates a scale placeholder for a layer with specified scale values.
 * @param layer - The layer to be scaled.
 * @param scale - The scale values.
 * @returns The newly created scale placeholder.
 */
async function createScalePlaceholder(layer: SceneNode, scale: Vector4) {
  const parent = layer.parent;
  const width = layer.width * scale.x;
  const height = layer.height * scale.y;
  const positionX = layer.x;
  const positionY = layer.y;
  const placeholder = figma.createFrame();
  placeholder.name = `${layer.name}-scalePlaceholder`;
  placeholder.x = positionX;
  placeholder.y = positionY;
  placeholder.resize(width, height);
  placeholder.fills = [];
  parent?.appendChild(placeholder);
  placeholder.appendChild(layer);
  await createScaleFrame(placeholder, layer, scale);
  layer.x = 0;
  layer.y = 0;
  layer.visible = false;
  layer.locked = true;
  return placeholder;
}

/**
 * Tries to refresh the scale placeholder based on the provided scale values.
 * @param layer - The layer to be checked and possibly refreshed.
 * @param scale - The new scale values.
 * @param oldScale - The old scale values.
 */
export function tryRefreshScalePlaceholder(layer: SceneNode, scale?: Vector4, oldScale?: Vector4) {
  if (scale && (!oldScale || !areVectorsEqual(scale, oldScale))) {
    if (isScaleLayer(layer)) {
      if (isOneScaleVector(scale)) {
        removeScalePlaceholder(layer);
      } else {
        updateScalePlaceholder(layer, scale);
      }
    } else if (!isOneScaleVector(scale)) {
      createScalePlaceholder(layer, scale);
    }
  }
}
