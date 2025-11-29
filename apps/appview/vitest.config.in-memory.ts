import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    setupFiles: "./vitest.setup.in-memory.ts",
    clearMocks: true,
  },
});
