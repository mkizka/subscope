import { pino } from "pino";

import type {
  ILoggerManager,
  LogLevel,
} from "../../domain/interfaces/logger.js";

export class LoggerManager implements ILoggerManager {
  private readonly rootLogger;

  constructor(logLevel: LogLevel) {
    this.rootLogger = pino({
      customLevels: {
        error: 50,
        warn: 40,
        info: 30,
        debug: 20,
      },
      useOnlyCustomLevels: true,
      level: logLevel,
      // disable pid and hostname in logs
      base: null,
      formatters: {
        level: (label) => ({ level: label }),
      },
    });
  }
  static inject = ["logLevel"] as const;

  createLogger(name: string) {
    return this.rootLogger.child({ name });
  }
}
