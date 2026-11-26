import { syntaxRule } from "../syntax-rule.js";

export default {
  rules: {
    "max-params": syntaxRule(
      ":function[params.length>2]",
      "引数が3つ以上の関数は、オブジェクト形式の名前付き引数に変更してください。",
    ),
  },
};
