import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "worker:unit",
    setupFiles: "./vitest.unit.setup.ts",
    include: ["./src/{application,domain,presentation}/**/*.test.ts"],
    clearMocks: true,
  },
});
