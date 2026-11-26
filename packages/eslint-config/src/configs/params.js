import plugin from "../plugins/params.js";

export const params = [
  {
    plugins: { params: plugin },
    rules: {
      "params/max-params": "error",
    },
  },
];
