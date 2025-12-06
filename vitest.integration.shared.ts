import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    globalSetup: "./vitest.integration.global-setup.ts",
    setupFiles: "./vitest.integration.setup.ts",
    include: ["src/infrastructure/**/*.test.ts"],
    testTimeout: 120000,
    clearMocks: true,
    // ファイル分離によってコネクションプールが作られ過ぎるのを防ぐため
    isolate: false,
    // 1パッケージにつき1つのPostgresを使用していてデータが競合するので直列実行にする
    maxWorkers: 1,
    sequence: { groupOrder: 2 },
  },
});
