import path from "node:path";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";

export const migrateDatabase = async (databaseUrl: string) => {
  const client = new Client(databaseUrl);
  await client.connect();
  try {
    await client.query("select pg_advisory_lock(hashtext('subscope:migrate'))");
    await migrate(drizzle({ client }), {
      migrationsFolder: path.resolve("../../packages/db/drizzle"),
    });
  } finally {
    await client.end();
  }
};
