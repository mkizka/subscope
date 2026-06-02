import importAlias from "@dword-design/eslint-plugin-import-alias";
import { mkizka } from "@mkizka/eslint-config";
import { defineConfig } from "eslint/config";
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
import storybook from "eslint-plugin-storybook";

export default defineConfig(
  {
    extends: mkizka,
    rules: {
      "@typescript-eslint/only-throw-error": "off",
    },
  },
  importAlias.configs.recommended,
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
