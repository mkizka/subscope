import {
  connectionPoolFactory,
  databaseFactory,
} from "@repo/common/infrastructure";
import type { DatabaseClient, ILoggerManager } from "@repo/common/interface";

export const dbFactory = ({
  databaseUrl,
  loggerManager,
}: {
  databaseUrl: string;
  loggerManager: ILoggerManager;
}): DatabaseClient =>
  databaseFactory(
    connectionPoolFactory({ databaseUrl: databaseUrl }),
    loggerManager,
  );
