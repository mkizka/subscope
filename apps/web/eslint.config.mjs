import { configs } from "@mkizka/eslint-config";
import next from "eslint-config-next-flat";

export default [
  {
    ignores: ["**/.next"],
  },
  next,
  ...configs.typescript(),
  ...configs.tailwind(),
];
