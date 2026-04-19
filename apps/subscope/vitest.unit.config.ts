import { unitConfig } from "@repo/vitest";
import { defineProject, mergeConfig } from "vitest/config";

const vitestConfig = mergeConfig(
  unitConfig,
  defineProject({
    resolve: {
      tsconfigPaths: true,
    },
    test: {
      name: "subscope:unit",
      include: [
        "server/**/*.test.ts",
        "!server/**/infrastructure/**/*.test.ts",
      ],
    },
  }),
);

export default vitestConfig;
