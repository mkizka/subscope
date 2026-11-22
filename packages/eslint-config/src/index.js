import { mkizka } from "@mkizka/eslint-config";

import { architecture } from "./configs/architecture.js";
import { atUri } from "./configs/at-uri.js";
import { di } from "./configs/di.js";
import { env } from "./configs/env.js";
import { react } from "./configs/react.js";

export const config = [...mkizka, ...architecture, ...atUri, ...di, ...env, ...react];
