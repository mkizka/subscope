import { defineProject, mergeConfig } from "vitest/config";

import sharedConfig from "../../vitest.unit.shared.js";

export default mergeConfig(
  sharedConfig,
  defineProject({
    test: {
      name: "blob-proxy:unit",
    },
  }),
);
