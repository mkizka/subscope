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
  PORT: z.coerce.number().default(3004),
  PLC_URL: z.url().default("https://plc.directory"),
  REDIS_URL: match({
    prod: z.string(),
    dev: z.string().default("redis://localhost:6379"),
  }),
  DATABASE_URL: match({
    prod: z.string(),
    dev: z
      .url()
      .default("postgresql://postgres:password@localhost:5432/postgres"),
  }),
  BLOB_CACHE_DIR: match({
    prod: z.string(),
    dev: z.string().default("./cache"),
  }),
  CACHE_CLEANUP_CRON: z.string().default("* * * * *"), // 1分間隔
  CACHE_CLEANUP_TIMEZONE: z.string().default("Asia/Tokyo"),
});

export const env = (() => {
  try {
    return schema.parse(process.env);
  } catch (e) {
    throw fromError(e);
  }
})();
