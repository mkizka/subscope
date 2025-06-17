import { pinoHttp } from "pino-http";

import type { Logger } from "../domain/interfaces/logger.js";

const noop = () => {};

export function loggingMiddleware(logger: Logger) {
  const isDevelopment = process.env.NODE_ENV === "development";
  return pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === "/metrics",
    },
    customSuccessMessage: (req, res, responseTime) => {
      return `${req.method} ${res.statusCode} ${req.url} ${responseTime}ms`;
    },
    customErrorMessage: (req, res) => {
      return `${req.method} ${res.statusCode} ${req.url}`;
    },
    customSuccessObject: isDevelopment ? noop : undefined,
    customErrorObject: isDevelopment ? noop : undefined,
  });
}
