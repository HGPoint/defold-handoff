/**
 * Utility module for handling calculating positions and shifts based on pivot points and parent sizes.
 * @packageDocumentation
 */


import { projectConfig } from "handoff/project";
import { vector4, addVectors } from "utilities/math";

/**
 * Checks if the pivot is located to the north.
 * @param pivot - The pivot to check.
 * @returns A boolean indicating if the pivot is located to the north.
 */
export function isPivotNorth(pivot: Pivot) {
  return pivot === "PIVOT_N" || pivot === "PIVOT_NE" || pivot === "PIVOT_NW";
}

/**
 * Checks if the pivot is located to the east.
 * @param pivot - The pivot to check.
 * @returns A boolean indicating if the pivot is located to the east.
 */
export function isPivotEast(pivot: Pivot) {
  return pivot === "PIVOT_NE" || pivot === "PIVOT_E" || pivot === "PIVOT_SE";
}

/**
 * Checks if the pivot is located to the south.
 * @param pivot - The pivot to check.
 * @returns A boolean indicating if the pivot is located to the south.
 */
export function isPivotSouth(pivot: Pivot) {
  return pivot === "PIVOT_S" || pivot === "PIVOT_SE" || pivot === "PIVOT_SW";
}

/**
 * Checks if the pivot is located to the west.
 * @param pivot - The pivot to check.
 * @returns A boolean indicating if the pivot is located to the west.
 */
export function isPivotWest(pivot: Pivot) {
  return pivot === "PIVOT_NW" || pivot === "PIVOT_W" || pivot === "PIVOT_SW";
}

/**
 * Calculates the pivoted position of a layer in its parent based on the pivot points and parent sizes.
 * @param centeredPosition - The centered position of the layer.
 * @param parentPivot - The pivot point of the parent.
 * @param parentSize - The size of the parent.
 * @returns The pivoted position of the layer.
 */
export function calculatePivotedPositionInParent(centeredPosition: Vector4, parentPivot: Pivot, parentSize: Vector4) {
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
 * Calculates the mandatory shift for the specific pivot point based on pivot points and parent sizes.
 * @param pivot - The pivot point of the layer.
 * @param parentPivot - The pivot point of the parent.
 * @param size - The size of the layer.
 * @param parentSize - The size of the parent.
 * @returns The pivoted shift.
 * TODO: Refactor this function into a few smaller functions.
 */
export function calculatePivotedShift(pivot: Pivot, parentPivot: Pivot, size: Vector4, parentSize: Vector4) {
  const { x: width, y: height } = size;
  const { y: parentHeight } = parentSize;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  let shiftX;
  let shiftY;
  if (isPivotNorth(parentPivot)) {
    if (isPivotNorth(pivot)) {
      shiftY = halfHeight - parentHeight;
    } else if (isPivotSouth(pivot)) {
      shiftY = -parentHeight - halfHeight;
    } else {
      shiftY = -parentHeight;
    }
  } else if (isPivotSouth(parentPivot)) {
    if (isPivotNorth(pivot)) {
      shiftY = halfHeight + parentHeight;
    } else if (isPivotSouth(pivot)) {
      shiftY = parentHeight - halfHeight;
    } else {
      shiftY = parentHeight
    }
  } else {
    if (isPivotNorth(pivot)) {
      shiftY = halfHeight;
    } else if (isPivotSouth(pivot)) {
      shiftY = -halfHeight;
    } else {
      shiftY = 0;
    }
  }
  if (isPivotEast(parentPivot)) {
    if (isPivotEast(pivot)) {
      shiftX = halfWidth;
    } else if (isPivotWest(pivot)) {
      shiftX = -halfWidth;
    } else {
      shiftX = 0;
    }
  } else if (isPivotWest(parentPivot)) {
    if (isPivotEast(pivot)) {
      shiftX = halfWidth;
    } else if (isPivotWest(pivot)) {
      shiftX = -halfWidth;
    } else {
      shiftX = 0;
    }
  } else {
    if (isPivotEast(pivot)) {
      shiftX = halfWidth;
    } else if (isPivotWest(pivot)) {
      shiftX = -halfWidth;
    } else {
      shiftX = 0;
    }
  }
  return vector4(shiftX, shiftY, 0, 1);
}

/**
 * Calculates the centered position of a layer in the root container.
 * @param layer - The layer to calculate the position for.
 * @param pivot - The pivot point of the layer.
 * @param parentPivot - The pivot point of the parent.
 * @param size - The size of the layer.
 * @param parentSize - The size of the parent.
 * @param parentShift - The shift of the parent.
 * @param data - GUI node data.
 * @returns The centered root position of the layer.
 */
function calculateCenteredRootPosition(layer: ExportableLayer, size: Vector4, parentSize: Vector4, parentShift: Vector4, data?: PluginGUINodeData | null) {
  if (data?.screen) {
    const { x, y } = calculateCenteredPosition(layer, size, parentSize);
    const rootX = x + parentShift.x;
    const rootY = y + projectConfig.screenSize.y - parentShift.y;
    return vector4(rootX, rootY, 0, 0);
  }
  return vector4(0);
}

/**
 * Calculates the position of a layer in the root container.
 * @param layer - The layer to calculate the position for.
 * @param pivot - The pivot point of the layer.
 * @param parentPivot - The pivot point of the parent.
 * @param size - The size of the layer.
 * @param parentSize - The size of the parent.
 * @param parentShift - The shift of the parent.
 * @param data - GUI node data.
 * @returns The root position of the layer.
 */
export function calculateRootPosition(layer: ExportableLayer, pivot: Pivot, parentPivot: Pivot, size: Vector4, parentSize: Vector4, parentShift: Vector4, data?: PluginGUINodeData | null) {
  const position = calculateCenteredRootPosition(layer, size, parentSize, parentShift, data);
  const pivotedPosition = calculatePivotedPosition(position, pivot, parentPivot, size, parentSize);
  return pivotedPosition;
}

/**
 * Calculates the center of a rectangle rotated around a point.
 * @param x - The x coordinate of top-left corner.
 * @param y - The y coordinate of top-left corner.
 * @param width - The width of the rectangle.
 * @param height - The height of the rectangle.
 * @param degrees - The rotation in degrees.
 * @returns The center of the rectangle.
 * TODO: Move this function to math utilities.
 */
function calculateCenter(x: number, y: number, width: number, height: number, degrees: number) {
  const radians = degrees * Math.PI / 180;
  const upperRightX = x + width * Math.cos(radians);
  const upperRightY = y - width * Math.sin(radians);
  const lowerLeftX = x + height * Math.sin(radians);
  const lowerLeftY = y + height * Math.cos(radians);
  const lowerRightX = upperRightX + height * Math.sin(radians);
  const lowerRightY = upperRightY + height * Math.cos(radians);
  const centerX = (x + lowerRightX + upperRightX + lowerLeftX) / 4;
  const centerY = (y + lowerRightY + upperRightY + lowerLeftY) / 4;
  return vector4(centerX, centerY, 0, 1);
}

/**
 * Calculates the centered position of a layer relative to its parent size.
 * @param layer - The layer to calculate the position for.
 * @param size - The size of the layer.
 * @param parentSize - The size of the parent.
 * @returns The centered position of the layer.
 */
export function calculateCenteredPosition(layer: ExportableLayer, size: Vector4, parentSize: Vector4) {
  const { x, y } = calculateCenter(layer.x, layer.y, size.x, size.y, layer.rotation);
  const centeredX = x - (parentSize.x / 2);
  const centeredY = (parentSize.y / 2) - y;
  return vector4(centeredX, centeredY, 0, 1);
}

/**
 * Calculates the pivoted position of a layer relative to its parent size.
 * @param layer - The layer to calculate the position for.
 * @param pivot - The pivot point of the layer.
 * @param parentPivot - The pivot point of the parent.
 * @param size - The size of the layer.
 * @param parentSize - The size of the parent.
 * @returns The centered position of the layer.
 */
export function calculatePivotedPosition(centeredPosition: Vector4, pivot: Pivot, parentPivot: Pivot, size: Vector4, parentSize: Vector4) {
  const position = calculatePivotedPositionInParent(centeredPosition, parentPivot, parentSize);
  const pivotedShift = calculatePivotedShift(pivot, parentPivot, size, parentSize);
  const pivotedPosition = addVectors(position, pivotedShift);
  return pivotedPosition;
}