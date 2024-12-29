import { configs } from "@mkizka/eslint-config";

export default [
  ...configs.typescript(),
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/method-signature-style": "error",
    },
  },
];
