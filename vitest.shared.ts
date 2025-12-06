import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    globalSetup: "./vitest.global-setup.ts",
    setupFiles: "./vitest.setup.ts",
    testTimeout: 120000, // 2 min
    clearMocks: true,
    // ファイル分離によってコネクションプールが作られ過ぎるのを防ぐため
    isolate: false,
    // 1パッケージにつき1つのPostgresを使用していてデータが競合するので直列実行にする
    maxConcurrency: 1,
  },
});
