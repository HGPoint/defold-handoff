import { copyArray, removeDoubles } from "utilities/array";
import { describe, expect, it } from "vitest";

describe("array", () => {
  it("should create a deep copy of the array", () => {
    const original = [1, 2, 3];
    const copy = copyArray(original);
    expect(copy).toEqual(original);
    expect(copy).not.toBe(original);
  });

  it("should handle nested arrays", () => {
    const original = [1, [2, 3], 4];
    const copy = copyArray(original);
    expect(copy).toEqual(original);
    expect(copy[1]).not.toBe(original[1]);
  });

  it("should handle arrays of objects", () => {
    const original = [{ a: 1 }, { b: 2 }];
    const copy = copyArray(original);
    expect(copy).toEqual(original);
    expect(copy[0]).not.toBe(original[0]);
  });

  it("should handle empty arrays", () => {
    const original: number[] = [];
    const copy = copyArray(original);
    expect(copy).toEqual(original);
    expect(copy).not.toBe(original);
  });

  it("should handle arrays with different types", () => {
    const original = [1, "string", true, null, { a: 1 }];
    const copy = copyArray(original);
    expect(copy).toEqual(original);
    expect(copy).not.toBe(original);
  });

  it("should remove duplicate values from the array", () => {
    const original = [1, 2, 2, 3, 3, 3];
    const result = removeDoubles(original);
    expect(result).toEqual([1, 2, 3]);
  });

  it("should handle arrays with no duplicates", () => {
    const original = [1, 2, 3];
    const result = removeDoubles(original);
    expect(result).toEqual(original);
  });

  it("should handle empty arrays", () => {
    const original: number[] = [];
    const result = removeDoubles(original);
    expect(result).toEqual(original);
  });

  it("should handle arrays with different types", () => {
    const original = [1, "1", 1, "1", true, false, true];
    const result = removeDoubles(original);
    expect(result).toEqual([1, "1", true, false]);
  });

  it("should handle arrays of objects", () => {
    const obj1 = { a: 1 };
    const obj2 = { b: 2 };
    const original = [obj1, obj1, obj2, obj2];
    const result = removeDoubles(original);
    expect(result).toEqual([obj1, obj2]);
  });
});