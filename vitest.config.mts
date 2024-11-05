import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    coverage: {
      reporter: ["text", "json", "html"],
    },
  },
  resolve: {
    alias: {
      "config": path.resolve(__dirname, "./src/config"),
      "components": path.resolve(__dirname, "./src/components"),
      "handoff": path.resolve(__dirname, "./src/handoff"),
      "state": path.resolve(__dirname, "./src/state"),
      "utilities": path.resolve(__dirname, "./src/utilities"),
    },
  },
});
