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
  PORT: z.coerce.number().default(3003),
  INDEX_LEVEL: z
    .enum(["1", "2"])
    .transform((val) => parseInt(val))
    .default(2),
  PLC_URL: z.url().default(
    match({
      prod: "https://plc.directory",
      dev: "http://localhost:2582",
    }),
  ),
  DATABASE_URL: match({
    prod: z.url(),
    dev: z
      .url()
      .default("postgresql://postgres:password@localhost:5432/postgres"),
  }),
  REDIS_URL: match({
    prod: z.url(),
    dev: z.url().default("redis://localhost:6379"),
  }),
  COMMIT_WORKER_CONCURRENCY: z.coerce.number().default(128),
  BACKFILL_BATCH_SIZE: z.coerce.number().default(100),
});

export const env = (() => {
  try {
    return schema.parse(process.env);
  } catch (e) {
    throw fromError(e);
  }
})();
