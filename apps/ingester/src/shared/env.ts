import { z } from "zod";
import { fromError } from "zod-validation-error";

const match = <Prod, Default>({ prod, dev }: { prod: Prod; dev: Default }) => {
  return process.env.NODE_ENV === "production" ? prod : dev;
};

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error"])
    .default(match({ prod: "info", dev: "debug" })),
  PORT: z.coerce.number().default(3002),
  TAP_URL: match({
    prod: z.url(),
    dev: z.url().default("http://localhost:2480"),
  }),
  MODERATION_URL: z.url().default(
    match({
      prod: "wss://mod.bsky.app",
      dev: "ws://localhost:2587",
    }),
  ),
  DISABLE_INGESTER: z.stringbool().default(false),
  REDIS_URL: match({
    prod: z.url(),
    dev: z.url().default("redis://localhost:6379"),
  }),
});

export const env = (() => {
  try {
    return schema.parse(process.env);
  } catch (e) {
    throw fromError(e);
  }
})();
