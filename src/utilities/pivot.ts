/**
 * Utility module for handling calculating positions and shifts based on pivot points and parent sizes.
 * @packageDocumentation
 */


import { projectConfig } from "handoff/project";
import { isFigmaSection, isFigmaPage } from "utilities/figma";
import { vector4, addVectors, calculateCenter } from "utilities/math";

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
 * Calculates the mandatory horizontal shift for the specific pivot point based on pivot points and parent sizes.
 * @param width - The width of the layer.
 * @param parentWidth - The width of the parent.
 * @param pivot - The pivot point of the layer.
 * @param parentPivot - The pivot point of the parent.
 * @returns The pivoted horizontal shift.
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
 * Calculates the mandatory vertical shift for the specific pivot point based on pivot points and parent sizes.
 * @param height - The height of the layer.
 * @param parentHeight - The height of the parent.
 * @param pivot - The pivot point of the layer.
 * @param parentPivot - The pivot point of the parent.
 * @returns The pivoted vertical shift.
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

/**
 * Calculates the mandatory shift for the specific pivot point based on pivot points and parent sizes.
 * @param pivot - The pivot point of the layer.
 * @param parentPivot - The pivot point of the parent.
 * @param size - The size of the layer.
 * @param parentSize - The size of the parent.
 * @returns The pivoted shift.
 */
export function calculatePivotedShift(pivot: Pivot, parentPivot: Pivot, size: Vector4, parentSize: Vector4) {
  const { x: width, y: height } = size;
  const { x: parentWidth, y: parentHeight } = parentSize;
  const shiftX = calculatePivotedHorizontalShift(width, parentWidth, pivot, parentPivot);
  const shiftY = calculatePivotedVerticalShift(height, parentHeight, pivot, parentPivot);
  return vector4(shiftX, shiftY, 0, 1);
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
function calculateCenteredRootPosition(layer: ExportableLayer, size: Vector4, parentSize: Vector4, parentShift: Vector4, asTemplate: boolean, data?: PluginGUINodeData | null) {
  if (data?.screen && !asTemplate) {
    if (layer.parent && (isFigmaPage(layer.parent) || isFigmaSection(layer.parent))) {
      const halfScreenWidth = projectConfig.screenSize.x / 2;
      const halfScreenHeight = projectConfig.screenSize.y / 2;
      return vector4(halfScreenWidth, halfScreenHeight, 0, 0);
    } else {
      const { x, y } = calculateCenteredPosition(layer, size, parentSize);    
      const rootX = x + parentShift.x;
      const rootY = y + projectConfig.screenSize.y - parentShift.y;
      return vector4(rootX, rootY, 0, 0);
    }
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
export function calculateRootPosition(layer: ExportableLayer, pivot: Pivot, parentPivot: Pivot, size: Vector4, parentSize: Vector4, parentShift: Vector4, asTemplate: boolean, data?: PluginGUINodeData | null) {
  const centeredPosition = calculateCenteredRootPosition(layer, size, parentSize, parentShift, asTemplate, data);
  if (data?.template && !asTemplate) {
    return centeredPosition;
  }
  const pivotedPosition = calculatePivotedPosition(centeredPosition, pivot, parentPivot, size, parentSize);
  return pivotedPosition;
}

/**
 * Converts the position of a child layer relative to its parent.
 * @param layer - The ExportableLayer to convert position for.
 * @param pivot - The pivot point of the child layer.
 * @param parentPivot - The pivot point of the parent layer.
 * @param size - The size of the child layer.
 * @param parentSize - The size of the parent layer.
 * @param parentShift - The shift vector of the parent layer.
 * @returns The converted position vector of the child layer.
 */
export function convertChildPosition(layer: ExportableLayer, pivot: Pivot, parentPivot: Pivot, size: Vector4, parentSize: Vector4, parentShift: Vector4) {
  const centeredPosition = calculateCenteredPosition(layer, size, parentSize);
  const pivotedPosition = calculatePivotedPosition(centeredPosition, pivot, parentPivot, size, parentSize);
  const shiftedX = pivotedPosition.x + parentShift.x;
  const shiftedY = pivotedPosition.y - parentShift.y;
  const shiftedPosition = vector4(shiftedX, shiftedY, 0, 1);
  return shiftedPosition;
}

/**w2 2 
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