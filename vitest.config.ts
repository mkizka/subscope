import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["apps/**/vitest.*.config.ts", "packages/**/vitest.*.config.ts"],
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
