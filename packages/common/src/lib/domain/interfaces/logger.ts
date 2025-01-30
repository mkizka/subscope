import type pino from "pino";

export type Logger = pino.Logger<"error" | "warn" | "info" | "debug">;

export interface ILoggerManager {
  createLogger: (name: string) => Logger;
}
