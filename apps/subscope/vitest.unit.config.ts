import { unitConfig } from "@repo/vitest";
import { defineProject, mergeConfig } from "vitest/config";

export default mergeConfig(
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
