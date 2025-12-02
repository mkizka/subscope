import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "worker:integration",
    globalSetup: "./vitest.integration.global-setup.ts",
    setupFiles: "./vitest.integration.setup.ts",
    // 移行期間中: infrastructureテスト + 未移行のapplication/domainテスト
    // 移行完了後は include: ["src/infrastructure/**/*.test.ts"] に変更予定
    include: [
      "src/infrastructure/**/*.test.ts",
      "src/{application,domain,presentation}/**/*.test.ts",
    ],
    // unit設定で既に含まれているテストを除外
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
