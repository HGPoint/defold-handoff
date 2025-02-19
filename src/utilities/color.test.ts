import { convertHexToRGBA } from "utilities/color";
import { vector4 } from "utilities/math";
import { describe, expect, it } from "vitest";

describe("color", () => {
  it("should convert #FFFFFF to vector4(1, 1, 1, 1)", () => {
    const result = convertHexToRGBA("#FFFFFF");
    expect(result).toEqual(vector4(1, 1, 1, 1));
  });

  it("should convert #000000 to vector4(0, 0, 0, 1)", () => {
    const result = convertHexToRGBA("#000000");
    expect(result).toEqual(vector4(0, 0, 0, 1));
  });

  it("should convert #FF0000 to vector4(1, 0, 0, 1)", () => {
    const result = convertHexToRGBA("#FF0000");
    expect(result).toEqual(vector4(1, 0, 0, 1));
  });

  it("should convert #00FF00 to vector4(0, 1, 0, 1)", () => {
    const result = convertHexToRGBA("#00FF00");
    expect(result).toEqual(vector4(0, 1, 0, 1));
  });

  it("should convert #0000FF to vector4(0, 0, 1, 1)", () => {
    const result = convertHexToRGBA("#0000FF");
    expect(result).toEqual(vector4(0, 0, 1, 1));
  });

  it("should convert #123456 to vector4(0.07058823529411765, 0.20392156862745098, 0.33725490196078434, 1)", () => {
    const result = convertHexToRGBA("#123456");
    expect(result).toEqual(vector4(0.07058823529411765, 0.20392156862745098, 0.33725490196078434, 1));
  });
});