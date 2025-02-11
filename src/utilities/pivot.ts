/**
 * Handles calculating positions relative to different pivots and environments.
 * @packageDocumentation
 */

import { PROJECT_CONFIG } from "handoff/project";
import { isFigmaPage, isFigmaSection } from "utilities/figma";
import { addVectors, calculateCenter, isZeroVector, shiftAlongAxis, vector4 } from "utilities/math";

/**
 * Determines whether the pivot point is located to the north.
 * @param pivot - The pivot point to check.
 * @returns True if the pivot point is located to the north, otherwise false.
 */
export function isPivotNorth(pivot: Pivot) {
  return pivot === "PIVOT_N" || pivot === "PIVOT_NE" || pivot === "PIVOT_NW";
}

/**
 * Determines whether the pivot point is located to the east.
 * @param pivot - The pivot point to check.
 * @returns True if the pivot point is located to the east, otherwise false.
 */
export function isPivotEast(pivot: Pivot) {
  return pivot === "PIVOT_NE" || pivot === "PIVOT_E" || pivot === "PIVOT_SE";
}

/**
 * Determines whether the pivot point is located to the south.
 * @param pivot - The pivot point to check.
 * @returns True if the pivot point is located to the south, otherwise false.
 */
export function isPivotSouth(pivot: Pivot) {
  return pivot === "PIVOT_S" || pivot === "PIVOT_SE" || pivot === "PIVOT_SW";
}

/**
 * Determines whether the pivot point is located to the west.
 * @param pivot - The pivot point to check.
 * @returns True if the pivot point is located to the west, otherwise false.
 */
export function isPivotWest(pivot: Pivot) {
  return pivot === "PIVOT_NW" || pivot === "PIVOT_W" || pivot === "PIVOT_SW";
}

/**
 * Calculates the centered position of the layer relative to its parent.
 * @param layer - The layer to calculate the centered position for.
 * @param size - The size of the layer.
 * @param parentSize - The size of the parent.
 * @returns The centered position of the layer.
 */
export function calculateCenteredPosition(layer: SceneNode, size: Vector4, parentSize: Vector4) {
  const rotation = "rotation" in layer ? layer.rotation : 0;
  const { x, y } = calculateCenter(layer.x, layer.y, size.x, size.y, rotation);
  const centeredX = x - (parentSize.x / 2);
  const centeredY = (parentSize.y / 2) - y;
  return vector4(centeredX, centeredY, 0, 0);
}

/** 
 * Calculates the pivoted position of the layer relative to its parent.
 * @param centeredPosition - The centered position of the layer.
 * @param pivot - The pivot point of the layer.
 * @param parentPivot - The pivot point of the parent.
 * @param size - The size of the layer.
 * @param parentSize - The size of the parent.
 * @returns The pivoted position of the layer.
 */
export function calculatePivotedPosition(centeredPosition: Vector4, pivot: Pivot, parentPivot: Pivot, size: Vector4, parentSize: Vector4, rotation: number) {
  const position = convertCenteredPositionToPivotedPosition(centeredPosition, parentPivot, parentSize);
  const pivotShift = calculatePivotedShift(pivot, parentPivot, size, parentSize, rotation);
  const pivotedPosition = addVectors(position, pivotShift);
  return pivotedPosition;
}

/**
 * Calculates the position of the layer in the root container.
 * @param layer - The layer to calculate the position for.
 * @param pivot - The pivot point of the layer.
 * @param parentPivot - The pivot point of the parent.
 * @param size - The size of the layer.
 * @param parentSize - The size of the parent.
 * @param parentShift - The shift of the parent.
 * @param asTemplate - Whether the layer is being exported as a template.
 * @param data - GUI node data of the layer.
 * @returns The root position of the layer.
 */
export function calculateRootPosition(layer: SceneNode, pivot: Pivot, parentPivot: Pivot, size: Vector4, parentSize: Vector4, parentShift: Vector4, asTemplate: boolean, data?: WithNull<PluginGUINodeData>) {
  const centeredPosition = calculateCenteredRootPosition(layer, size, parentSize, parentShift, asTemplate, data);
  if (data?.template && !asTemplate) {
    return centeredPosition;
  }
  const rotation = "rotation" in layer ? layer.rotation : 0;
  const pivotedPosition = calculatePivotedPosition(centeredPosition, pivot, parentPivot, size, parentSize, rotation);
  return pivotedPosition;
}

/**
 * Calculates the centered position of the layer in the root container.
 * @param layer - The layer to calculate the position for.
 * @param pivot - The pivot point of the layer.
 * @param parentPivot - The pivot point of the parent.
 * @param size - The size of the layer.
 * @param parentSize - The size of the parent.
 * @param parentShift - The shift of the parent.
 * @param asTemplate - Whether the layer is being exported as a template.
 * @param data - GUI node data of the layer.
 * @returns The centered root position of the layer.
 */
export function calculateCenteredRootPosition(layer: SceneNode, size: Vector4, parentSize: Vector4, parentShift: Vector4, asTemplate: boolean, data?: WithNull<PluginGUINodeData>) {
  if (data?.screen && !asTemplate) {
    const halfScreenWidth = PROJECT_CONFIG.screenSize.x / 2;
    const halfScreenHeight = PROJECT_CONFIG.screenSize.y / 2;
    const { parent } = layer;
    if (parent && (isFigmaPage(parent) || isFigmaSection(parent))) {
      return vector4(halfScreenWidth, halfScreenHeight, 0, 0);
    } else {
      const { x, y } = calculateCenteredPosition(layer, size, parentSize);
      const rootX = x + halfScreenWidth + parentShift.x;
      const rootY = y + halfScreenHeight + parentShift.y;
      return vector4(rootX, rootY, 0, 0);
    }
  }
  if (isZeroVector(parentSize)) {
    return vector4(0);
  }
  return calculateCenteredPosition(layer, size, parentSize);
}

/**
 * Calculates the position of the child layer relative to its parent.
 * @param layer - The child layer to convert the position for.
 * @param pivot - The pivot point of the child layer.
 * @param parentPivot - The pivot point of the parent layer.
 * @param size - The size of the child layer.
 * @param parentSize - The size of the parent layer.
 * @param parentShift - The shift vector of the parent layer.
 * @param asTemplate - Whether the child layer is being exported as a template.
 * @param data - GUI node data of the child layer.
 * @returns The position of the child layer.
 */
export function calculateChildPosition(layer: SceneNode, pivot: Pivot, parentPivot: Pivot, size: Vector4, parentSize: Vector4, parentShift: Vector4, asTemplate?: boolean, data?: WithNull<PluginGUINodeData>) {
  const centeredPosition = calculateCenteredPosition(layer, size, parentSize);
  if (data?.template && !asTemplate) {
    const shiftedCenterX = centeredPosition.x + parentShift.x;
    const shiftedCenterY = centeredPosition.y - parentShift.y;
    const shiftedCenterPosition = vector4(shiftedCenterX, shiftedCenterY, 0, 0);
    return shiftedCenterPosition;
  }
  const rotation = "rotation" in layer ? layer.rotation : 0;
  const pivotedPosition = calculatePivotedPosition(centeredPosition, pivot, parentPivot, size, parentSize, rotation);
  const shiftedX = pivotedPosition.x + parentShift.x;
  const shiftedY = pivotedPosition.y - parentShift.y;
  const shiftedPosition = vector4(shiftedX, shiftedY, 0, 0);
  return shiftedPosition;
}

/**
 * Converts the centered position of the layer to the pivoted position relative to its parent.
 * @param centeredPosition - The centered position of the layer.
 * @param parentPivot - The pivot point of the parent.
 * @param parentSize - The size of the parent.
 * @returns The pivoted position of the layer.
 */
export function convertCenteredPositionToPivotedPosition(centeredPosition: Vector4, parentPivot: Pivot, parentSize: Vector4) {
  const { x, y } = centeredPosition;
  const { x: width, y: height } = parentSize;
  const position = centeredPosition;
  if (isPivotNorth(parentPivot)) {
    position.y = y + height / 2;
  } else if (isPivotSouth(parentPivot)) {
    position.y = y - height / 2;
  }
  if (isPivotEast(parentPivot)) {
    position.x = x - width / 2;
  } else if (isPivotWest(parentPivot)) {
    position.x = x + width / 2;
  }
  return position;
}

/**
 * Calculates the shift of the layer for the pivot point relative to the parent.
 * @param pivot - The pivot point of the layer.
 * @param parentPivot - The pivot point of the parent.
 * @param size - The size of the layer.
 * @param parentSize - The size of the parent.
 * @returns The shift of the layer.
 */
export function calculatePivotedShift(pivot: Pivot, parentPivot: Pivot, size: Vector4, parentSize: Vector4, rotation: number) {
  const { x: width, y: height } = size;
  const { x: parentWidth, y: parentHeight } = parentSize;
  const x = calculatePivotedHorizontalShift(width, parentWidth, pivot, parentPivot);
  const y = calculatePivotedVerticalShift(height, parentHeight, pivot, parentPivot);
  const straightShift = vector4(x, y, 0, 0);
  const shift = shiftAlongAxis(straightShift, rotation); 
  return shift;
}

/**
 * Calculates the horizontal shift of the layer for the pivot point relative to the parent.
 * @param width - The width of the layer.
 * @param parentWidth - The width of the parent.
 * @param pivot - The pivot point of the layer.
 * @param parentPivot - The pivot point of the parent.
 * @returns The horizontal shift of the layer.
 */
function calculatePivotedHorizontalShift(width: number, parentWidth: number, pivot: Pivot, parentPivot: Pivot) {
  const halfWidth = width / 2;
  if (isPivotEast(parentPivot)) {
    if (isPivotEast(pivot)) {
      return halfWidth;
    } else if (isPivotWest(pivot)) {
      return -halfWidth;
    } else {
      return 0;
    }
  } else if (isPivotWest(parentPivot)) {
    if (isPivotEast(pivot)) {
      return halfWidth;
    } else if (isPivotWest(pivot)) {
      return -halfWidth;
    } else {
      return 0;
    }
  } else {
    if (isPivotEast(pivot)) {
      return halfWidth;
    } else if (isPivotWest(pivot)) {
      return -halfWidth;
    } else {
      return 0;
    }
  }
}

/**
 * Calculates the vertical shift of the layer for the pivot point relative to the parent.
 * @param height - The height of the layer.
 * @param parentHeight - The height of the parent.
 * @param pivot - The pivot point of the layer.
 * @param parentPivot - The pivot point of the parent.
 * @returns The vertical shift of the layer.
 */
function calculatePivotedVerticalShift(height: number, parentHeight: number, pivot: Pivot, parentPivot: Pivot) {
  const halfHeight = height / 2;
  if (isPivotNorth(parentPivot)) {
    if (isPivotNorth(pivot)) {
      return halfHeight - parentHeight;
    } else if (isPivotSouth(pivot)) {
      return -parentHeight - halfHeight;
    }
    return -parentHeight;
  } else if (isPivotSouth(parentPivot)) {
    if (isPivotNorth(pivot)) {
      return halfHeight + parentHeight;
    } else if (isPivotSouth(pivot)) {
      return parentHeight - halfHeight;
    }
    return parentHeight
  } else {
    if (isPivotNorth(pivot)) {
      return halfHeight;
    } else if (isPivotSouth(pivot)) {
      return -halfHeight;
    }
    return 0;
  }
}
