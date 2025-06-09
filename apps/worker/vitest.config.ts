import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "worker",
    // testcontainersの起動を待つ
    hookTimeout: 60000,
    clearMocks: true,
  },
});
