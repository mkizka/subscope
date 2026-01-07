import { integrationConfig } from "@repo/vitest";
import { defineProject, mergeConfig } from "vitest/config";

export default mergeConfig(
  integrationConfig,
  defineProject({
    test: {
      name: "appview:integration",
      include: ["src/infrastructure/**/*.test.ts"],
    },
  }),
);
