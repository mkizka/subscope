import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "apps/*",
      "!apps/appview",
      "!apps/worker",
      "!apps/blob-proxy",
      "apps/appview/vitest.unit.config.ts",
      "apps/appview/vitest.integration.config.ts",
      "apps/worker/vitest.unit.config.ts",
      "apps/worker/vitest.integration.config.ts",
      "apps/blob-proxy/vitest.unit.config.ts",
      "apps/blob-proxy/vitest.integration.config.ts",
      "packages/*",
    ],
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
