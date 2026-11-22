import plugin from "../plugins/condition.js";

export const condition = [
  {
    plugins: { condition: plugin },
    rules: {
      "condition/no-await-in-if": "error",
    },
  },
];
