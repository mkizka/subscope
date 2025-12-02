import { configs } from "@mkizka/eslint-config";

export default [
  ...configs.typescript(),
  {
    files: ["**/*.in-memory.ts"],
    rules: {
      "@typescript-eslint/require-await": "off",
    },
  },
];
