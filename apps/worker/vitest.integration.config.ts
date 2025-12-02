import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "worker:integration",
    globalSetup: "./vitest.integration.global-setup.ts",
    setupFiles: "./vitest.integration.setup.ts",
    include: [
      "src/infrastructure/**/*.test.ts",
      "src/{application,domain,presentation}/**/*.test.ts",
    ],
    exclude: ["src/application/services/indexer/follow-indexer.test.ts"],
    testTimeout: 120000,
    clearMocks: true,
    isolate: false,
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
