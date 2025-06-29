import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "appview",
    globalSetup: "./vitest.global-setup.ts",
    // testcontainersの起動を待つ
    hookTimeout: 60000,
    clearMocks: true,
  },
});
