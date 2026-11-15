import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "apps/**/vitest.*.config.ts",
      "packages/**/vitest.*.config.ts",
      { test: { name: "scripts:unit", include: ["scripts/**/*.test.ts"] } },
    ],
    coverage: {
      exclude: [
        "**/generated/**",
        "**/dist/**",
        "**/coverage/**",
        "**/eslint.config.?(m)js",
        "**/vitest.config.ts",
        "**/build.ts",
      ],
    },
  },
});
