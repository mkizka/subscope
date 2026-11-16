import { syntaxRule } from "../syntax-rule.js";

const noUseCaseImport = {
  meta: { type: "problem", schema: [] },
  create(context) {
    return {
      ImportDeclaration(node) {
        if (/-use-case(\.js)?$/.test(node.source.value)) {
          context.report({
            node,
            message:
              "usecaseから別のusecaseを呼ばないでください。共通の処理はserviceに切り出してください。",
          });
        }
      },
    };
  },
};

export const architecture = [
  {
    plugins: {
      architecture: {
        rules: {
          "no-use-case-import": noUseCaseImport,
          "repository-methods": syntaxRule(
            "TSInterfaceDeclaration[id.name=/^I\\w*Repository$/] > TSInterfaceBody > [key.name!=/^(find|save|delete)$/]",
            "リポジトリのメソッドはfind・save・deleteのみにしてください。読み取りはクエリサービスに書いてください(docs/dev/repository-and-query.md)。",
          ),
        },
      },
    },
    rules: { "architecture/repository-methods": "error" },
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
  {
    // TODO: AccountStatus / BackfillStatus の@repo/db依存の切り離しと、IHandleResolverのdomain移動で削除する
    files: [
      "**/src/application/use-cases/identity/upsert-identity-command.ts",
      "**/src/application/use-cases/async/check-backfill-use-case.ts",
      "**/src/application/services/index-account-service.ts",
      "**/src/application/record-parsers.ts",
      "**/src/domain/account.ts",
      "**/src/domain/service/at-uri-service.ts",
      "**/src/application/use-cases/sync/get-backfill-statuses-use-case.ts",
      "**/src/application/interfaces/queries/registration-query.ts",
      "**/src/domain/models/account.ts",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
];
