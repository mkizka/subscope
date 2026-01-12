import { unitConfig } from "@repo/vitest";
import { defineProject, mergeConfig } from "vitest/config";

export default mergeConfig(
  unitConfig,
  defineProject({
    test: {
      name: "subscope:unit",
      include: ["src/**/*.test.ts", "!src/**/infrastructure/**/*.test.ts"],
    },
  }),
);
