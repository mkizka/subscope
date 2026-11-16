import { syntaxRule } from "../syntax-rule.js";

export const di = [
  {
    plugins: {
      di: {
        rules: {
          "no-arrow-function": syntaxRule(
            "CallExpression[callee.property.name=/^(service|replaceService)$/] > ArrowFunctionExpression",
            "DIの配線にアロー関数を書かないでください。必ずクラスを作成し、asClassArgsで登録してください。",
          ),
        },
      },
    },
    rules: { "di/no-arrow-function": "error" },
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
