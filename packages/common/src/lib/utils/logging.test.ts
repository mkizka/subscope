import { createServer } from "node:http";
import { Writable } from "node:stream";

import { pino } from "pino";
import { expect, test } from "vitest";

import type { LogLevel } from "../interface/logger.js";
import { loggingMiddleware } from "./logging.js";

test("リクエストログのauthorizationとcookieを伏せる", async () => {
  const lines: string[] = [];
  const logger = pino<LogLevel>(
    {
      customLevels: { error: 50, warn: 40, info: 30, debug: 20 },
      useOnlyCustomLevels: true,
    },
    new Writable({
      write(chunk, _, callback) {
        lines.push(String(chunk));
        callback();
      },
    }),
  );
  const middleware = loggingMiddleware(logger, false);
  const server = createServer((req, res) => {
    middleware(req, res);
    res.end();
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (typeof address !== "object" || !address) throw new Error();

  await fetch(`http://localhost:${address.port}/`, {
    headers: { authorization: "Bearer secret-token", cookie: "session=secret" },
  });
  server.close();

  const log = lines.join("");
  expect(log).toContain("[Redacted]");
  expect(log).not.toContain("secret");
});
