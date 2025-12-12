import { pino } from "pino";

import type {
  ILoggerManager,
  LogLevel,
} from "../../domain/interfaces/logger.js";

export class InMemoryLoggerManager implements ILoggerManager {
  private readonly rootLogger;

  constructor(_logLevel: LogLevel = "info") {
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

  createLogger(name: string) {
    return this.rootLogger.child({ name });
  }

  clear(): void {
    // No-op for in-memory implementation
  }
}
