import {
  connectionPoolFactory,
  databaseFactory,
  migrateDatabase,
} from "@repo/common/infrastructure";
import type { DatabaseClient, ILoggerManager } from "@repo/common/interface";

import type { Env } from "@/app/server/env";

export const dbFactory = async ({
  env,
  loggerManager,
}: {
  env: Pick<Env, "DATABASE_URL">;
  loggerManager: ILoggerManager;
}): Promise<DatabaseClient> => {
  await migrateDatabase(env.DATABASE_URL);
  return databaseFactory(connectionPoolFactory({ env }), loggerManager);
};
