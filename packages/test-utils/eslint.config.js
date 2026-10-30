import { mkizka } from "@mkizka/eslint-config";

export default [
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
      ],
    },
  },
];
