import { syntaxRule } from "../syntax-rule.js";

export default {
  rules: {
    "no-await-in-if": syntaxRule(
      "IfStatement > AwaitExpression.test, IfStatement > .test AwaitExpression",
      "if文の条件でawaitせず、結果を変数に代入してから条件に使ってください。",
    ),
  },
};
