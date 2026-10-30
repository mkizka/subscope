import { pino } from "pino";
export class LoggerManager {
  rootLogger;
  constructor(logLevel) {
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
  createLogger(name) {
    return this.rootLogger.child({ name });
  }
}
