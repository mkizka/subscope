import { defineConfig } from "vitest/config";

export default defineConfig({
  server: {
    watch: null,
  },
  test: {
    projects: [
      "apps/appview/vitest.unit.config.ts",
      "apps/worker/vitest.unit.config.ts",
    ],
  },
});
