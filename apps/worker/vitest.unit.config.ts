import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "worker:unit",
    setupFiles: "./vitest.unit.setup.ts",
    include: [
      "./src/application/services/indexer/follow-indexer.test.ts",
      "./src/application/services/indexer/profile-indexer.test.ts",
      "./src/application/services/indexer/repost-indexer.test.ts",
    ],
    clearMocks: true,
  },
});
