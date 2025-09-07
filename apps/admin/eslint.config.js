import { configs } from "@mkizka/eslint-config";
import storybook from "eslint-plugin-storybook";

export default [
  ...configs.typescript(),
  ...configs.react(),
  ...storybook.configs["flat/recommended"],
];
