import { describe, it, expect } from "vitest";
import evaluateExpression from "utilities/evaluation";

describe("evaluation", () => {
  it("should evaluate a valid mathematical expression", () => {
    const expression = "2 + 3 * 4";
    const result = evaluateExpression(expression);
    expect(result).toBe(14);
  });

  it("should return null for an invalid mathematical expression", () => {
    const expression = "2 + 3 *";
    const result = evaluateExpression(expression);
    expect(result).toBeNull();
  });

  it("should evaluate a complex mathematical expression", () => {
    const expression = "(2 + 3) * (4 - 1)";
    const result = evaluateExpression(expression);
    expect(result).toBe(15);
  });

  it("should handle division by zero", () => {
    const expression = "10 / 0";
    const result = evaluateExpression(expression);
    expect(result).toEqual(Infinity);
  });

  it("should handle empty string as input", () => {
    const expression = "";
    const result = evaluateExpression(expression);
    expect(result).toBeNull();
  });
});