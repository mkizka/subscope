import plugin from "../plugins/env.js";

export const env = [
  {
    plugins: { env: plugin },
    rules: {
      "env/no-env-import": "error",
      "env/no-env-value": "error",
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message:
            "process.envはenv.tsでだけ読み、DIのvalueとして渡してください。",
        },
      ],
    },
  },
  {
    // drizzle-kitのCLI設定と、アプリ外のプロダクション起動スクリプト(PORTのみ)はDIを通らないため
    files: [
      "**/shared/env.ts",
      "**/server/env.ts",
      "**/drizzle.config.ts",
      "**/server.js",
    ],
    rules: { "no-restricted-properties": "off" },
  },
  {
    files: [
      "**/server/di.ts",
      "**/shared/registry.ts",
      "**/src/worker.ts",
      "**/src/appview.ts",
      "**/server.js",
    ],
    rules: { "env/no-env-import": "off" },
  },
];
