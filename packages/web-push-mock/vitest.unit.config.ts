import { unitConfig } from "@repo/vitest";
import { defineProject, mergeConfig } from "vitest/config";

export default mergeConfig(
  unitConfig,
  defineProject({
    test: {
      name: "web-push-mock:unit",
      include: ["src/**/*.test.ts"],
    },
  }),
);
