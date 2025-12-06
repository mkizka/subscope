import { defineProject, mergeConfig } from "vitest/config";

import sharedConfig from "../../vitest.integration.shared.js";

export default mergeConfig(
  sharedConfig,
  defineProject({
    test: {
      name: "worker:integration",
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
        "src/application/services/index-actor-service.test.ts",
        "src/application/services/index-record-service.test.ts",
        "src/application/use-cases/commit/index-commit-use-case.test.ts",
        "src/application/use-cases/account/handle-account-use-case.test.ts",
        "src/application/use-cases/identity/upsert-identity-use-case.test.ts",
        "src/application/use-cases/async/resolve-did-use-case.test.ts",
        "src/application/use-cases/async/sync-repo-use-case.test.ts",
      ],
    },
  }),
);
