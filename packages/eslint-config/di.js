export const rules = {};

export const restrictedSyntax = [
  {
    selector:
      "CallExpression[callee.property.name=/^(service|replaceService)$/] > ArrowFunctionExpression",
    message:
      "DIの配線にアロー関数を書かないでください。必ずクラスを作成し、asClassArgsで登録してください。",
  },
];

export const configs = [
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
