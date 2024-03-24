import { isZeroVector4 } from "utilities/math";
import { getPluginData, isFigmaComponentInstance, isAtlasSprite } from "utilities/figma";

export async function canBeSlice9(layer: SceneNode) {
  if (layer.type === "RECTANGLE") {
    return true;
  }
  if (isFigmaComponentInstance(layer)) {
    return await isAtlasSprite(layer);
  }
  return false;
}

function isSlice9(layer: SceneNode) {
  return getPluginData(layer, "defoldSlice9");
}

function removeSlice9Placeholder(layer: SceneNode) {
  console.log("Remove slice9 placeholder", layer.name);
}

function createSlice9Placeholder(layer: SceneNode, slice9: Vector4) {
  console.log("Create slice9 placeholder", layer.name, slice9);
}

function updateSlice9Placeholder(layer: SceneNode, slice9: Vector4) {
  console.log("Create slice9 placeholder", layer.name, slice9);
}

export async function refreshSlice9Placeholder(layer: SceneNode, slice9: Vector4 | undefined) {
  if (slice9) {
    if (isSlice9(layer)) {
      if (isZeroVector4(slice9)) {
        removeSlice9Placeholder(layer);
      } else {
        updateSlice9Placeholder(layer, slice9);
      }
    } else if (!isZeroVector4(slice9) && await canBeSlice9(layer)) {
      createSlice9Placeholder(layer, slice9);
    }
  }
}
