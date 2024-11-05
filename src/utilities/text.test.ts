import { PROJECT_CONFIG } from "handoff/project";
import { vector4 } from "utilities/math";
import { calculateTextScale } from "utilities/text";
import { describe, expect, it } from "vitest";

describe("text", () => {
  it("should calculate the correct text scale based on the font size", () => {
    PROJECT_CONFIG.fontSize = 16;
    const fontSize = 32;
    const expectedScale = vector4(2, 2, 2, 1);
    const result = calculateTextScale(fontSize);
    expect(result).toEqual(expectedScale);
  });

  it("should return a scale of 1 when font size is equal to the default font size", () => {
    PROJECT_CONFIG.fontSize = 16;
    const fontSize = 16;
    const expectedScale = vector4(1, 1, 1, 1);
    const result = calculateTextScale(fontSize);
    expect(result).toEqual(expectedScale);
  });

  it("should return a smaller scale when font size is less than the default font size", () => {
    PROJECT_CONFIG.fontSize = 16;
    const fontSize = 8;
    const expectedScale = vector4(0.5, 0.5, 0.5, 1);
    const result = calculateTextScale(fontSize);
    expect(result).toEqual(expectedScale);
  });
});