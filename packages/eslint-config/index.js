import { mkizka } from "@mkizka/eslint-config";

const effectPadding = {
  meta: { type: "layout", fixable: "whitespace", schema: [] },
  create(context) {
    const sourceCode = context.sourceCode;
    return {
      "ExpressionStatement > CallExpression[callee.name=/^use(Layout)?Effect$/]"(
        call,
      ) {
        const node = call.parent;
        const prev = sourceCode.getTokenBefore(node, { includeComments: true });
        if (
          prev &&
          prev.value !== "{" &&
          node.loc.start.line - prev.loc.end.line < 2
        ) {
          context.report({
            node,
            message: "useEffectの前に空行を入れてください。",
            fix: (fixer) => fixer.insertTextAfter(prev, "\n"),
          });
        }
        const next = sourceCode.getTokenAfter(node, { includeComments: true });
        if (
          next &&
          next.value !== "}" &&
          next.loc.start.line - node.loc.end.line < 2
        ) {
          context.report({
            node,
            message: "useEffectの後に空行を入れてください。",
            fix: (fixer) => fixer.insertTextAfter(node, "\n"),
          });
        }
      },
    };
  },
};

const noEnvImport = {
  meta: { type: "problem", schema: [] },
  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.importKind === "type") return;
        if (/(^|\/)env(\.js)?$/.test(node.source.value)) {
          context.report({
            node,
            message:
              "env.tsの値はDIの配線(di.ts・registry.ts・エントリーポイント)でだけ読み、ほかはEnv型かDIのvalueで受け取ってください。",
          });
        }
      },
    };
  },
};

const noEnvValue = {
  meta: { type: "problem", schema: [] },
  create(context) {
    return {
      "CallExpression[callee.property.name='value'] > MemberExpression[object.name='env']"(
        node,
      ) {
        context.report({
          node,
          message:
            'envの個別の項目をvalueで登録しないでください。.value("env", env)で渡し、利用側で["env"]を受け取ってください。',
        });
      },
    };
  },
};

export const config = [
  ...mkizka,
  {
    plugins: {
      local: {
        rules: {
          "effect-padding": effectPadding,
          "no-env-import": noEnvImport,
          "no-env-value": noEnvValue,
        },
      },
    },
    rules: {
      "local/effect-padding": "error",
      "local/no-env-import": "error",
      "local/no-env-value": "error",
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
    rules: {
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message:
            "process.envはenv.tsでだけ読み、DIのvalueとして渡してください。",
        },
      ],
    },
  },
  {
    // drizzle-kitのCLI設定と、アプリ外のプロダクション起動スクリプト(PORTのみ)はDIを通らないため
    files: [
      "**/shared/env.ts",
      "**/server/env.ts",
      "**/drizzle.config.ts",
      "**/server.js",
    ],
    rules: { "no-restricted-properties": "off" },
  },
  {
    files: [
      "**/server/di.ts",
      "**/shared/registry.ts",
      "**/src/worker.ts",
      "**/src/appview.ts",
    ],
    rules: { "local/no-env-import": "off" },
  },
  {
    // 個別のvalueからenvへの移行が終わるまで除外する
    files: ["**/shared/registry.ts"],
    rules: { "local/no-env-value": "off" },
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
