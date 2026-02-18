import { unitConfig } from "@repo/vitest";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineProject, mergeConfig } from "vitest/config";

const vitestConfig = mergeConfig(
  unitConfig,
  defineProject({
    plugins: [tsconfigPaths()],
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
