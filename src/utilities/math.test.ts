import { addVectors, areVectorsEqual, calculateCenter, calculateHypotenuse, clamp, copyVector, isOneScaleVector, isVector4, isZeroVector, readableNumber, subVectors, vector4 } from "utilities/math";
import { describe, expect, it } from "vitest";

describe("math", () => {
  it("should create a Vector4 with default values", () => {
    const vector = vector4(1);
    expect(vector).toEqual({ x: 1, y: 1, z: 1, w: 1 });
  });

  it("should create a Vector4 with specified values", () => {
    const vector = vector4(1, 2, 3, 4);
    expect(vector).toEqual({ x: 1, y: 2, z: 3, w: 4 });
  });

  it("should identify a valid Vector4", () => {
    const vector = { x: 1, y: 2, z: 3, w: 4 };
    expect(isVector4(vector)).toBe(true);
  });

  it("should identify an invalid Vector4", () => {
    const vector = { x: 1, y: 2, z: 3 };
    expect(isVector4(vector)).toBe(false);
  });

  it("should identify a zero vector", () => {
    const vector = vector4(0, 0, 0, 0);
    expect(isZeroVector(vector)).toBe(true);
  });

  it("should identify a non-zero vector", () => {
    const vector = vector4(1, 0, 0, 0);
    expect(isZeroVector(vector)).toBe(false);
  });

  it("should identify a one-scale vector", () => {
    const vector = vector4(1, 1, 0, 0);
    expect(isOneScaleVector(vector)).toBe(true);
  });

  it("should identify a non-one-scale vector", () => {
    const vector = vector4(1, 2, 0, 0);
    expect(isOneScaleVector(vector)).toBe(false);
  });

  it("should identify equal vectors", () => {
    const vectorA = vector4(1, 2, 3, 4);
    const vectorB = vector4(1, 2, 3, 4);
    expect(areVectorsEqual(vectorA, vectorB)).toBe(true);
  });

  it("should identify non-equal vectors", () => {
    const vectorA = vector4(1, 2, 3, 4);
    const vectorB = vector4(4, 3, 2, 1);
    expect(areVectorsEqual(vectorA, vectorB)).toBe(false);
  });

  it("should add two vectors", () => {
    const vectorA = vector4(1, 2, 3, 4);
    const vectorB = vector4(4, 3, 2, 1);
    expect(addVectors(vectorA, vectorB)).toEqual(vector4(5, 5, 3, 4));
  });

  it("should subtract two vectors", () => {
    const vectorA = vector4(4, 3, 2, 1);
    const vectorB = vector4(1, 2, 3, 4);
    expect(subVectors(vectorA, vectorB)).toEqual(vector4(3, 1, 2, 1));
  });

  it("should copy a vector", () => {
    const vector = vector4(1, 2, 3, 4);
    expect(copyVector(vector)).toEqual(vector);
  });

  it("should clamp a value", () => {
    expect(clamp(5, 1, 10)).toBe(5);
    expect(clamp(0, 1, 10)).toBe(1);
    expect(clamp(15, 1, 10)).toBe(10);
  });

  it("should format a number to three decimal places", () => {
    expect(readableNumber(1.23456)).toBe(1.235);
    expect(readableNumber(1.23444)).toBe(1.234);
  });

  it("should calculate the center of a rotated rectangle", () => {
    const center = calculateCenter(0, 0, 300, 200, -45);
    expect(center.x).toBeCloseTo(35.355);
    expect(center.y).toBeCloseTo(176.777);
  });

  it("should calculate the hypotenuse of a right triangle", () => {
    expect(calculateHypotenuse(3, 4)).toBe(5);
  });
});