import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // testcontainersの起動を待つ
    hookTimeout: 30000,
  },
});
