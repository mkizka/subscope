import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    // インメモリリポジトリを使用するテスト用設定
    // globalSetup、setupFilesを除外（DBを起動しない）
    testTimeout: 120000, // 2 min
    clearMocks: true,
  },
});
