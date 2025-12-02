import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "worker:unit",
    setupFiles: "./vitest.unit.setup.ts",
    include: [
      "./src/application/services/indexer/follow-indexer.test.ts",
      "./src/application/use-cases/commit/index-commit-use-case.test.ts",
      "./src/application/use-cases/account/handle-account-use-case.test.ts",
      "./src/application/use-cases/identity/upsert-identity-use-case.test.ts",
    ],
    clearMocks: true,
  },
});
