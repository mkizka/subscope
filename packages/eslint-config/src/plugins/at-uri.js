import { syntaxRule } from "../syntax-rule.js";

export default {
  rules: {
    "no-as-did-host": syntaxRule(
      "CallExpression[callee.name='asDid'] > MemberExpression.arguments[property.name=/^(host|hostname)$/]",
      "asDid(uri.host)ではなく、AtUriのdidを使ってください。",
    ),
    "no-split-uri": syntaxRule(
      "CallExpression[callee.property.name='split'][arguments.0.value='/']",
      "URIを文字列で分解せず、AtUriのdid・collection・rkeyを使ってください。",
    ),
    "no-starts-with-at-uri": syntaxRule(
      "CallExpression[callee.property.name='startsWith'][arguments.0.quasis.0.value.raw='at://']",
      "URIの持ち主を文字列で比べず、new AtUri(uri).hostで比べてください。",
    ),
    "no-template-at-uri": syntaxRule(
      "TemplateLiteral[quasis.0.value.raw=/^at:\\/\\//][expressions.1]",
      "URIを文字列で組み立てず、AtUri.make(did, collection, rkey)を使ってください。",
    ),
  },
};
