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
    files: ["public/sw.js"],
    languageOptions: { globals: { self: "readonly" } },
  },
  {
    files: ["app/**/*.{ts,tsx}"],
    ignores: [
      "app/server/application/**/*.ts",
      "app/server/infrastructure/db/db.ts",
      "app/server/infrastructure/auth/oauth-storage.ts",
      "app/server/infrastructure/push/push-subscription-command.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^@repo/db",
              message:
                "webは認証とプッシュ通知の購読以外でDBに触れず、XRPCを経由してください。",
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
            "TSTypeAnnotation > TSTypeReference[typeName.name='StoryObj']",
          message:
            "storyの型はStoryObjを直接書かず、type Story = StoryObj<typeof meta>;を定義して使ってください。",
        },
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
    rules: {
      "better-tailwindcss/no-restricted-classes": [
        "error",
        {
          restrict: [
            {
              pattern: "(^|:)-?z-(\\d+|\\[.+\\]|\\(.+\\))$",
              message:
                "z-indexの数字は直接書かず、DESIGN.mdの重なり順にある名前付きのz-raised・z-sticky・z-nav・z-dropdown・z-overlayを使ってください。",
            },
          ],
        },
      ],
    },
  },
);
