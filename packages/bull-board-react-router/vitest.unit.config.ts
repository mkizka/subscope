import { unitConfig } from "@repo/vitest";
import { defineProject, mergeConfig } from "vitest/config";

export default mergeConfig(
  unitConfig,
  defineProject({
    test: {
      name: "bull-board-react-router:unit",
      include: ["src/**/*.test.ts"],
    },
  }),
);
