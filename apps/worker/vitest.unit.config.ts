import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "worker:unit",
    setupFiles: "./vitest.unit.setup.ts",
    // 移行期間中: インメモリリポジトリに移行済みのテストのみを含める
    // Phase 10完了時点では follow-indexer.test.ts のみ
    // 移行完了後は include: ["./src/{application,domain,presentation}/**/*.test.ts"] に変更予定
    include: [
      "./src/application/services/indexer/follow-indexer.test.ts",
      // 今後移行するテストをここに追加
    ],
    clearMocks: true,
  },
});
