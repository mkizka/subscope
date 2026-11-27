import { syntaxRule } from "../syntax-rule.js";

export default {
  rules: {
    "max-params": syntaxRule(
      ":function[params.length>2]:not(:matches(CallExpression, NewExpression) > *, :matches(CallExpression, NewExpression) > ObjectExpression > Property > *)",
      "引数を3つ以上にせず、オブジェクト形式の名前付き引数にまとめてください。すべてを1つのオブジェクトにする必要はなく、(url, options) のように主な引数とオプションのオブジェクトの2つに分けても構いません。",
    ),
  },
};
