import { connectionPoolFactory } from "@repo/common/infrastructure";
import { schema } from "@repo/db";
import { drizzle } from "drizzle-orm/node-postgres";

import { env } from "@/server/shared/env.js";

const pool = connectionPoolFactory(env.DATABASE_URL);

export const db = drizzle({
  client: pool,
  schema,
  casing: "snake_case",
});
