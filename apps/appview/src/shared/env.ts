import { z } from "zod/v4";
import { fromError } from "zod-validation-error";

const match = <Prod, Default>({ prod, dev }: { prod: Prod; dev: Default }) => {
  return process.env.NODE_ENV === "production" ? prod : dev;
};

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error"])
    .default(match({ prod: "info", dev: "debug" })),
  PORT: z.coerce.number().default(3001),
  PUBLIC_DOMAIN:
    process.env.NODE_ENV === "production"
      ? z.string()
      : z.string().default("appview.localhost"),
  DATABASE_URL: match({
    prod: z.url(),
    dev: z
      .url()
      .default("postgresql://postgres:password@localhost:5432/postgres"),
  }),
  PLC_URL: z.url().default(
    match({
      prod: "https://plc.directory",
      dev: "http://localhost:2582",
    }),
  ),
  REDIS_URL: match({
    prod: z.url(),
    dev: z.url().default("redis://localhost:6379"),
  }),
  BLOB_PROXY_URL: match({
    prod: z.url(),
    dev: z.url().default("http://localhost:3004"),
  }),
  ADMIN_DID: match({
    prod: z.string(),
    dev: z.string().default("did:web:admin.localhost"),
  }),
});

export const env = (() => {
  try {
    return schema.parse(process.env);
  } catch (e) {
    throw fromError(e);
  }
})();
