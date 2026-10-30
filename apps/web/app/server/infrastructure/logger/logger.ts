import type { ILoggerManager } from "@repo/common/domain";
import { LoggerManager } from "@repo/common/infrastructure";

import { env } from "@/app/server/env";

export const loggerManagerFactory = (): ILoggerManager =>
  new LoggerManager(env.LOG_LEVEL);
