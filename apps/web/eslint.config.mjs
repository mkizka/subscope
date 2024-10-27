import { configs } from "@mkizka/eslint-config";

export default [
  {
    ignores: ["**/.next"],
  },
  ...configs.typescript(),
  ...configs.react(),
  ...configs.tailwind(),
];
