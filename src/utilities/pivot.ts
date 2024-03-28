import { vector4, addVectors } from "utilities/math";

export function isPivotNorth(pivot: Pivot) {
  return pivot === "PIVOT_N" || pivot === "PIVOT_NE" || pivot === "PIVOT_NW";
}

export function isPivotEast(pivot: Pivot) {
  return pivot === "PIVOT_NE" || pivot === "PIVOT_E" || pivot === "PIVOT_SE";
}

export function isPivotSouth(pivot: Pivot) {
  return pivot === "PIVOT_S" || pivot === "PIVOT_SE" || pivot === "PIVOT_SW";
}

export function isPivotWest(pivot: Pivot) {
  return pivot === "PIVOT_NW" || pivot === "PIVOT_W" || pivot === "PIVOT_SW";
}

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

export function calculateRootPosition(layer: ExportableLayer, pivot: Pivot, parentPivot: Pivot, size: Vector4, parentSize: Vector4) {
  const position = vector4(0);
  const pivotedPosition = calculatePivotedPosition(position, pivot, parentPivot, size, parentSize);
  return pivotedPosition;
}

export function calculateCenteredPosition(layer: ExportableLayer, size: Vector4, parentSize: Vector4) {
  const x = layer.x + (size.x / 2) - (parentSize.x / 2);
  const y = (parentSize.y / 2) - layer.y - (size.y / 2);
  return vector4(x, y, 0, 1);
}

export function calculatePivotedPosition(centeredPosition: Vector4, pivot: Pivot, parentPivot: Pivot, size: Vector4, parentSize: Vector4) {
  const position = calculatePivotedPositionInParent(centeredPosition, parentPivot, parentSize);
  const pivotedShift = calculatePivotedShift(pivot, parentPivot, size, parentSize);
  const pivotedPosition = addVectors(position, pivotedShift);
  return pivotedPosition;
}