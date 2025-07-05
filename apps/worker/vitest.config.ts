import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "worker",
    globalSetup: "./vitest.global-setup.ts",
    testTimeout: 120000, // 2 min
    clearMocks: true,
  },
});
