import { mkizka } from "@mkizka/eslint-config";

import * as architecture from "./architecture.js";
import * as di from "./di.js";
import * as env from "./env.js";
import * as react from "./react.js";

const modules = [di, architecture, react, env];

export const config = [
  ...mkizka,
  {
    plugins: {
      local: { rules: Object.assign({}, ...modules.map((m) => m.rules)) },
    },
    rules: {
      "no-restricted-syntax": [
        "error",
        ...modules.flatMap((m) => m.restrictedSyntax),
      ],
    },
  },
  ...modules.flatMap((m) => m.configs),
];
