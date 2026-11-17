import { syntaxRule } from "../syntax-rule.js";

export default {
  rules: {
    "no-arrow-function": syntaxRule(
      "CallExpression[callee.property.name=/^(service|replaceService)$/] > ArrowFunctionExpression",
      "DIの配線にアロー関数を書かないでください。必ずクラスを作成し、asClassArgsで登録してください。",
    ),
  },
};
