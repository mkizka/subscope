import { pino } from "pino";
export class InMemoryLoggerManager {
  rootLogger;
  constructor(_logLevel = "info") {
    this.rootLogger = pino({
      customLevels: {
        error: 50,
        warn: 40,
        info: 30,
        debug: 20,
      },
      useOnlyCustomLevels: true,
      level: "silent",
      base: null,
      formatters: {
        level: (label) => ({ level: label }),
      },
    });
  }
  createLogger(name) {
    return this.rootLogger.child({ name });
  }
  clear() {
    // No-op for in-memory implementation
  }
}
