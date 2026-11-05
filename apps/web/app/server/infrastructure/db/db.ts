import {
  connectionPoolFactory,
  databaseFactory,
} from "@repo/common/infrastructure";
import type { DatabaseClient, ILoggerManager } from "@repo/common/interface";

import { env } from "@/app/server/env";

export const dbFactory = ({
  loggerManager,
}: {
  loggerManager: ILoggerManager;
}): DatabaseClient =>
  databaseFactory(
    connectionPoolFactory({ databaseUrl: env.DATABASE_URL }),
    loggerManager,
  );
