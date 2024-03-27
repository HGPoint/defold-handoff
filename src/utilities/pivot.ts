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
  const { x: parentWidth, y: parentHeight } = parentSize;
  let shiftX;
  let shiftY;
  if (isPivotNorth(parentPivot)) {
    if (isPivotNorth(pivot)) {
      shiftY = 0;
    } else if (isPivotSouth(pivot)) {
      shiftY = parentHeight * -2;
    } else {
      shiftY = parentHeight * -1.5;
    }
  } else if (isPivotSouth(parentPivot)) {
    if (isPivotNorth(pivot)) {
      shiftY = parentHeight * 2;
    } else if (isPivotSouth(pivot)) {
      shiftY = 0;
    } else {
      shiftY = parentHeight * 1.5;
    }
  } else {
    if (isPivotNorth(pivot)) {
      shiftY = height / 2;
    } else if (isPivotSouth(pivot)) {
      shiftY = height / -2;
    } else {
      shiftY = 0;
    }
  }
  if (isPivotEast(parentPivot)) {
    if (isPivotEast(pivot)) {
      shiftX = 0;
    } else if (isPivotWest(pivot)) {
      shiftX = parentWidth * -2;
    } else {
      shiftX = parentWidth * -1.5;
    }
  } else if (isPivotWest(parentPivot)) {
    if (isPivotEast(pivot)) {
      shiftX = parentWidth * 2;
    } else if (isPivotWest(pivot)) {
      shiftX = 0;
    } else {
      shiftX = parentWidth * 1.5;
    }
  } else {
    if (isPivotEast(pivot)) {
      shiftX = width / 2;
    } else if (isPivotWest(pivot)) {
      shiftX = width / -2;
    } else {
      shiftX = 0;
    }
  }
  return vector4(shiftX, shiftY, 0, 1);
}

export function calculatePivotedPosition(centeredPosition: Vector4, pivot: Pivot, parentPivot: Pivot, size: Vector4, parentSize: Vector4) {
  const position = calculatePivotedPositionInParent(centeredPosition, parentPivot, parentSize);
  const shift = calculatePivotedShift(pivot, parentPivot, size, parentSize);
  const pivotedPosition = addVectors(position, shift);
  return pivotedPosition;
}