import { defineProject } from "vitest/config";

export default defineProject({
  server: {
    watch: null,
  },
  test: {
    setupFiles: "./vitest.unit.setup.ts",
    clearMocks: true,
    sequence: { groupOrder: 1 },
  },
});
