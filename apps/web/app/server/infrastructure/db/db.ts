import {
  connectionPoolFactory,
  databaseFactory,
} from "@repo/common/infrastructure";
import type { DatabaseClient, ILoggerManager } from "@repo/common/interface";

import type { Env } from "@/app/server/env";

export const dbFactory = ({
  env,
  loggerManager,
}: {
  env: Pick<Env, "DATABASE_URL">;
  loggerManager: ILoggerManager;
}): DatabaseClient =>
  databaseFactory(connectionPoolFactory({ env }), loggerManager);
