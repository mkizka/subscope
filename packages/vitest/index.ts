import { defineProject } from "vitest/config";

export const unitConfig = defineProject({
  test: {
    setupFiles: "./vitest.unit.setup.ts",
    clearMocks: true,
    sequence: { groupOrder: 1 },
  },
});

export const integrationConfig = defineProject({
  test: {
    globalSetup: "./vitest.integration.global-setup.ts",
    setupFiles: "./vitest.integration.setup.ts",
    hookTimeout: 60000,
    clearMocks: true,
    // ファイル分離によってコネクションプールが作られ過ぎるのを防ぐため
    isolate: false,
    // 1パッケージにつき1つのPostgresを使用していてデータが競合するので直列実行にする
    maxWorkers: 1,
    sequence: { groupOrder: 2 },
  },
});
