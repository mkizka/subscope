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
    extends: [eslintPluginBetterTailwindcss.configs.recommended],
    settings: {
      "better-tailwindcss": {
        entryPoint: "app/app.css",
        strictness: "loose",
      },
    },
  },
);
