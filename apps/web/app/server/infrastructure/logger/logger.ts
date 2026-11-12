import { LoggerManager } from "@repo/common/infrastructure";
import type { ILoggerManager } from "@repo/common/interface";

import type { Env } from "@/app/server/env";

export const loggerManagerFactory = ({
  env,
}: {
  env: Pick<Env, "LOG_LEVEL">;
}): ILoggerManager => new LoggerManager(env);
