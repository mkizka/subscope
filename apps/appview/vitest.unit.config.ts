import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "appview:unit",
    setupFiles: "./vitest.unit.setup.ts",
    include: ["./src/{application,domain,presentation}/**/*.test.ts"],
    clearMocks: true,
  },
});
