import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["apps/*", "packages/*"],
    coverage: {
      exclude: [
        "**/generated/**",
        "**/dist/**",
        "**/coverage/**",
        "**/eslint.config.?(m)js",
        "**/vitest.config.ts",
        "**/build.mjs",
      ],
    },
  },
});
