import { unitConfig } from "@repo/vitest";
import { defineProject, mergeConfig } from "vitest/config";

export default mergeConfig(
  unitConfig,
  defineProject({
    test: {
      name: "appview:unit",
      include: ["src/{application,domain,presentation}/**/*.test.ts"],
    },
  }),
);
