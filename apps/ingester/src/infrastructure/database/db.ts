import { createDatabase } from "@dawn/db";

import { env } from "../../shared/env.js";

export const db = createDatabase(env.DATABASE_URL);
