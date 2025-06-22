import { configs } from "@mkizka/eslint-config";

export default [
  ...configs.typescript(),
  ...configs.react(),
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
          assertionStyle: "never",
        },
      ],
    },
  },
];
