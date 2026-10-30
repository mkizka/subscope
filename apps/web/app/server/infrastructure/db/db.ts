import type { DatabaseClient, ILoggerManager } from "@repo/common/domain";
import {
  connectionPoolFactory,
  databaseFactory,
} from "@repo/common/infrastructure";

import { env } from "@/app/server/env";

export const dbFactory = ({
  loggerManager,
}: {
  loggerManager: ILoggerManager;
}): DatabaseClient =>
  databaseFactory(connectionPoolFactory(env.DATABASE_URL), loggerManager);
