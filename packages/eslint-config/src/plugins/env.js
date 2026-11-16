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

export const env = [
  {
    plugins: {
      env: {
        rules: {
          "no-env-import": noEnvImport,
          "no-env-value": noEnvValue,
        },
      },
    },
    rules: {
      "env/no-env-import": "error",
      "env/no-env-value": "error",
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
      "**/server.js",
    ],
    rules: { "env/no-env-import": "off" },
  },
];
