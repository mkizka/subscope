import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "worker",
    globalSetup: "./vitest.global-setup.ts",
    // testcontainersの起動を待つ
    hookTimeout: 60000,
    clearMocks: true,
  },
});
