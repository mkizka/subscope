import { mkizka } from "@mkizka/eslint-config";
import storybook from "eslint-plugin-storybook";

export default [...mkizka, ...storybook.configs["flat/recommended"]];
