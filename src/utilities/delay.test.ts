import delay from "utilities/delay";
import { describe, expect, it, vi } from "vitest";

describe("delay", () => {
  it("should delay execution for the specified time", async () => {
    const time = 1000;
    const start = Date.now();
    await delay(time);
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(time);
  });

  it("should resolve after the specified time", async () => {
    const time = 1000;
    const mockFn = vi.fn();
    const promise = delay(time).then(mockFn);
    expect(mockFn).not.toHaveBeenCalled();
    await promise;
    expect(mockFn).toHaveBeenCalled();
  });
});