import { integrationConfig } from "@repo/vitest";
import { defineProject, mergeConfig } from "vitest/config";

export default mergeConfig(
  integrationConfig,
  defineProject({
    test: {
      name: "subscope:integration",
      include: ["server/**/infrastructure/**/*.test.ts"],
    },
  }),
);
