import { config } from "@repo/eslint-config";

export default [
  ...config,
  {
    // 個別のvalueからenvへの移行が終わるまで除外する
    files: ["src/shared/registry.ts"],
    rules: { "local/no-env-value": "off" },
  },
];
