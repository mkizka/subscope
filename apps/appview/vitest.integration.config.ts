import { defineProject, mergeConfig } from "vitest/config";

import sharedConfig from "../../vitest.integration.shared.js";

export default mergeConfig(
  sharedConfig,
  defineProject({
    test: {
      name: "appview:integration",
    },
  }),
);
