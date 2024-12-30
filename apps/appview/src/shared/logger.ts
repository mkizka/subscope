import { pino } from "pino";

import { env } from "./env.js";

const logger = pino({
  customLevels: {
    error: 50,
    warn: 40,
    info: 30,
    debug: 20,
  },
  useOnlyCustomLevels: true,
  level: env.LOG_LEVEL,
  formatters: {
    level: (label) => ({ level: label }),
  },
});

export const createLogger = (name: string) => logger.child({ name });
