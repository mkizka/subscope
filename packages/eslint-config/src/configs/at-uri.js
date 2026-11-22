import plugin from "../plugins/at-uri.js";

export const atUri = [
  {
    plugins: { "at-uri": plugin },
    rules: {
      "at-uri/no-as-did-host": "error",
      "at-uri/no-split-uri": "error",
      "at-uri/no-starts-with-at-uri": "error",
      "at-uri/no-template-at-uri": "error",
    },
  },
];
