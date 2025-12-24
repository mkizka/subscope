import { defineProject, mergeConfig } from "vitest/config";

import sharedConfig from "../../vitest.unit.shared.js";

export default mergeConfig(
  sharedConfig,
  defineProject({
    test: {
      name: "common:unit",
      include: ["src/**/*.test.ts"],
    },
  }),
);
