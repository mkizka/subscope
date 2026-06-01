import { LoggerManager } from "@repo/common/infrastructure";

import { env } from "@/app/shared/env.js";

export const loggerManager = new LoggerManager(env.LOG_LEVEL);
