import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    setupFiles: "./vitest.unit.setup.ts",
    include: ["./src/{application,domain,presentation}/**/*.test.ts"],
    clearMocks: true,
    sequence: { groupOrder: 1 },
  },
});
