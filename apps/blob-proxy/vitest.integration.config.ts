import { defineProject, mergeConfig } from "vitest/config";

import sharedConfig from "../../vitest.integration.shared.js";

export default mergeConfig(
  sharedConfig,
  defineProject({
    test: {
      name: "blob-proxy:integration",
      include: ["src/infrastructure/**/*.test.ts"],
    },
  }),
);
