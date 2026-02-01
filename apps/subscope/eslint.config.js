import importAlias from "@dword-design/eslint-plugin-import-alias";
import { mkizka } from "@mkizka/eslint-config";
import { defineConfig } from "eslint/config";
import storybook from "eslint-plugin-storybook";

export default defineConfig(
  mkizka,
  importAlias.configs.recommended,
  storybook.configs["flat/recommended"],
);
