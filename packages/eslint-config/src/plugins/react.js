import { syntaxRule } from "../syntax-rule.js";

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

export const react = [
  {
    plugins: {
      react: {
        rules: {
          "effect-padding": effectPadding,
          "no-form": syntaxRule(
            "JSXOpeningElement[name.name='form']",
            "素の<form>は使わず、conformのuseFormとgetFormPropsを使ってください。",
          ),
        },
      },
    },
    rules: {
      "react/effect-padding": "error",
      "react/no-form": "error",
    },
  },
];
