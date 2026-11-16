import { mkizka } from "@mkizka/eslint-config";

import { architecture } from "./plugins/architecture.js";
import { di } from "./plugins/di.js";
import { env } from "./plugins/env.js";
import { react } from "./plugins/react.js";

export const config = [...mkizka, ...architecture, ...di, ...env, ...react];
