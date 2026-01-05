import { mkizka } from "@mkizka/eslint-config";

export default [
  ...mkizka,
  {
    files: ["**/*.in-memory.ts"],
    rules: {
      "@typescript-eslint/require-await": "off",
    },
  },
];
