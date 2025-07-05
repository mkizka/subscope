import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["apps/*", "packages/*"],
    isolate: false, // ファイル分離によってコネクションプールが作られ過ぎるのを防ぐため
    coverage: {
      exclude: [
        "**/generated/**",
        "**/dist/**",
        "**/eslint.config.?(m)js",
        "**/vitest.config.ts",
        "**/build.mjs",
      ],
    },
  },
});
