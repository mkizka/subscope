import type pino from "pino";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type Logger = pino.Logger<LogLevel>;

export interface ILoggerManager {
  createLogger: (name: string) => Logger;
}
