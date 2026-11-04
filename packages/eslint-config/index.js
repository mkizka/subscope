import { mkizka } from "@mkizka/eslint-config";

export const config = [
  ...mkizka,
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.property.name=/^(service|replaceService)$/] > ArrowFunctionExpression",
          message:
            "DIの配線にアロー関数を書かないでください。必ずクラスを作成し、asClassArgsで登録してください。",
        },
        {
          selector:
            "TSInterfaceDeclaration[id.name=/^I\\w*Repository$/] > TSInterfaceBody > [key.name!=/^(find|save|delete)$/]",
          message:
            "リポジトリのメソッドはfind・save・deleteのみにしてください。読み取りはクエリサービスに書いてください(docs/dev/repository-and-query.md)。",
        },
      ],
    },
  },
  {
    files: ["**/*.in-memory.ts"],
    rules: {
      "@typescript-eslint/require-await": "off",
    },
  },
  {
    files: ["**/src/{domain,application}/**/*.ts"],
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
  {
    files: ["**/shared/registry.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(?!@gyaku/di$|@repo/|\\.)",
              message:
                "DIの配線でライブラリを直接使わないでください。自前のinterfaceを実装したクラスでラップしてください(例: LabelCursorStore)。",
            },
          ],
        },
      ],
    },
  },
];
