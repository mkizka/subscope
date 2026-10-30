import { mkizka } from "@mkizka/eslint-config";

export default [
  ...mkizka,
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.property.name=/^(service|replaceService)$/] > ArrowFunctionExpression",
          message:
            "DIの配線にアロー関数を書かないでください。必ずクラスを作成し、asClassArgsで登録してください。",
        },
      ],
    },
  },
  {
    files: ["**/*.in-memory.ts"],
    rules: {
      "@typescript-eslint/require-await": "off",
    },
  },
  {
    files: ["src/application/**", "src/shared/**", "src/lib/domain/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "keyv",
                "@keyv/*",
                "bullmq",
                "pg",
                "pino",
                "pino-*",
                "prom-client",
                "ws",
                "drizzle-orm",
                "drizzle-orm/*",
                "@atproto/tap",
                "@atproto/identity",
              ],
              allowTypeImports: true,
              message:
                "ライブラリを直接使わないでください。infrastructure層にクラスを作成してラップしてください(例: LabelCursorStore)。",
            },
          ],
        },
      ],
    },
  },
];
