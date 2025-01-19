import { pino } from "pino";
import { ILoggerManager, Logger } from "../domain/interfaces/logger.js";
import { IConfig } from "../domain/interfaces/config.js";

export class LoggerManager implements ILoggerManager {
  private readonly rootLogger: Logger;

  constructor(private readonly config: IConfig) {
    this.rootLogger = pino({
      customLevels: {
        error: 50,
        warn: 40,
        info: 30,
        debug: 20,
      },
      useOnlyCustomLevels: true,
      level: this.config.LOG_LEVEL,
      // disable pid and hostname in logs
      base: null,
      formatters: {
        level: (label) => ({ level: label }),
      },
    });
  }
  static inject = ["config"] as const;

  createLogger(name: string) {
    return this.rootLogger.child({ name });
  }
}
