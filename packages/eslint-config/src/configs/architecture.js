import plugin from "../plugins/architecture.js";

export const architecture = [
  {
    plugins: { architecture: plugin },
    rules: {
      "architecture/repository-methods": "error",
      "architecture/use-case-execute-only": "error",
      "architecture/execute-only-in-use-case": "error",
    },
  },
  {
    files: ["**/*-use-case.ts"],
    rules: { "architecture/no-use-case-import": "error" },
  },
  {
    files: ["**/*.in-memory.ts"],
    rules: {
      "@typescript-eslint/require-await": "off",
    },
  },
  {
    files: [
      "**/src/{domain,application}/**/*.ts",
      "**/app/server/application/**/*.ts",
    ],
    ignores: ["**/*.test.ts", "**/*.in-memory.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/infrastructure/**", "**/presentation/**"],
              message:
                "domain・application層からinfrastructure・presentation層をimportしないでください。依存は外側から内側の一方向にします。",
            },
            {
              group: ["@repo/db", "@repo/common/infrastructure"],
              message:
                "domain・application層からDBスキーマやインフラをimportしないでください。必要な型は自層で定義してください。",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/src/domain/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/infrastructure/**",
                "**/presentation/**",
                "**/application/**",
                "@repo/db",
                "@repo/common/infrastructure",
              ],
              message: "domain層は他の層やDBスキーマをimportしないでください。",
            },
          ],
        },
      ],
    },
  },
];
