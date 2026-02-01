import { unitConfig } from "@repo/vitest";
import { defineProject, mergeConfig } from "vitest/config";

import viteConfig from "./vite.config.js";

const vitestConfig = mergeConfig(
  unitConfig,
  defineProject({
    test: {
      name: "subscope:unit",
      include: [
        "server/**/*.test.ts",
        "!server/**/infrastructure/**/*.test.ts",
      ],
    },
  }),
);

export default mergeConfig(viteConfig, vitestConfig);
