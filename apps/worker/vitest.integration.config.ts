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
    exclude: [
      "src/application/services/indexer/follow-indexer.test.ts",
      "src/application/services/indexer/like-indexer.test.ts",
      "src/application/services/indexer/post-indexer.test.ts",
      "src/application/services/indexer/profile-indexer.test.ts",
      "src/application/services/indexer/repost-indexer.test.ts",
      "src/application/use-cases/commit/index-commit-use-case.test.ts",
      "src/application/use-cases/account/handle-account-use-case.test.ts",
      "src/application/use-cases/identity/upsert-identity-use-case.test.ts",
    ],
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
