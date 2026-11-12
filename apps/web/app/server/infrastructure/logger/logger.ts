import { LoggerManager } from "@repo/common/infrastructure";
import type { ILoggerManager } from "@repo/common/interface";

export const loggerManagerFactory = ({
  logLevel,
}: {
  logLevel: ConstructorParameters<typeof LoggerManager>[0];
}): ILoggerManager => new LoggerManager(logLevel);
