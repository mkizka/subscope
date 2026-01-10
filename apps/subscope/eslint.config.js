import { mkizka } from "@mkizka/eslint-config";
import { defineConfig } from "eslint/config";
import storybook from "eslint-plugin-storybook";

export default defineConfig(mkizka, storybook.configs["flat/recommended"]);
