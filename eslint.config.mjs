import { configs } from "@mkizka/eslint-config";

export default [
  {
    ignores: ["**/.next"],
  },
  {
    settings: {
      tailwindcss: {
        config: "./apps/web/tailwind.config.ts",
      },
    },
    languageOptions: {
      parserOptions: {
        // https://typescript-eslint.io/troubleshooting/typed-linting/monorepos/#one-tsconfigjson-per-package-and-an-optional-one-in-the-root
        project: ["./apps/*/tsconfig.json"],
      },
    },
  },
  ...configs.typescript({
    alias: {
      "@": "./app",
    },
  }),
  ...configs.react(),
  ...configs.tailwind(),
];
