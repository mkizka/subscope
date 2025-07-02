import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "appview",
    globalSetup: "./vitest.global-setup.ts",
    testTimeout: 10000,
    clearMocks: true,
  },
});
