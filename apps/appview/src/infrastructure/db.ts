import { createDatabase } from "@dawn/db";

import { env } from "../shared/env.js";
import { createLogger } from "../shared/logger.js";

const logger = createLogger("db");

export const db = createDatabase({
  url: env.DATABASE_URL,
  logger,
});
