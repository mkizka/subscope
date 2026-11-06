import importAlias from "@dword-design/eslint-plugin-import-alias";
import { config } from "@repo/eslint-config";
import { defineConfig } from "eslint/config";
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
import storybook from "eslint-plugin-storybook";

export default defineConfig(
  {
    extends: config,
    rules: {
      "@typescript-eslint/only-throw-error": "off",
    },
  },
  importAlias.configs.recommended,
  {
    files: ["app/**/*.{ts,tsx}"],
    ignores: [
      "app/server/application/**/*.ts",
      "app/server/infrastructure/db/db.ts",
      "app/server/infrastructure/auth/oauth-storage.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^@repo/db",
              message: "webは認証以外でDBに触れず、XRPCを経由してください。",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["app/server/di.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(?!@gyaku/di$|\\.)",
              message:
                "DIの配線でライブラリを直接使わないでください。自前のinterfaceを返すファクトリ関数でラップしてください。",
            },
          ],
        },
      ],
    },
  },
  storybook.configs["flat/recommended"],
  {
    files: ["app/**/*.stories.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ObjectExpression > Property[key.name='render']",
          message:
            "storyでrenderを上書きして別のコンポーネントを描画しないでください。コンポーネントごとにstoriesファイルを分け、argsで状態を表現してください。",
        },
      ],
    },
  },
  {
    extends: [eslintPluginBetterTailwindcss.configs.recommended],
    settings: {
      "better-tailwindcss": {
        entryPoint: "app/app.css",
        strictness: "loose",
      },
    },
  },
);
