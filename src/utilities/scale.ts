import { getPluginData } from "utilities/figma";
import { isOneScaleVector } from "utilities/math";

function isScaleLayer(layer: SceneNode) {
  return !!getPluginData(layer, "defoldScale")
}

function removeScalePlaceholder(layer: SceneNode) {
  console.log(layer.name);
}

function updateScalePlaceholder(layer: SceneNode, scale: Vector4) {
  console.log(layer.name, scale);
}

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

export function tryRefreshScalePlaceholder(layer: SceneNode, scale?: Vector4) {
  if (scale) {
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
