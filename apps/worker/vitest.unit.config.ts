import { defineProject, mergeConfig } from "vitest/config";

import sharedConfig from "../../vitest.unit.shared.js";

export default mergeConfig(
  sharedConfig,
  defineProject({
    test: {
      name: "worker:unit",
      include: ["src/{application,domain,presentation}/**/*.test.ts"],
    },
  }),
);
