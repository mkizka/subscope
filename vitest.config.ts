import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["apps/*", "packages/*"],
    isolate: false, // ファイル分離によってコネクションプールが作られ過ぎるのを防ぐため
    poolOptions: {
      forks: {
        // 1パッケージにつき1つのPostgresを使用していてデータが競合するので直列実行にする
        singleFork: true,
      },
    },
    coverage: {
      exclude: [
        "**/generated/**",
        "**/dist/**",
        "**/coverage/**",
        "**/eslint.config.?(m)js",
        "**/vitest.config.ts",
        "**/build.mjs",
      ],
    },
  },
});
