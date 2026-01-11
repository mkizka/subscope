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
  PORT: z.coerce.number().default(3001),
  SERVICE_DID: match({
    prod: z.string(),
    dev: z.string().default("did:web:localhost%3A3001"),
  }),
  PUBLIC_URL: match({
    prod: z.url(),
    dev: z.url().default("http://localhost:3001"),
  }),
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
  TAP_URL: match({
    prod: z.url(),
    dev: z.url().default("http://localhost:2480"),
  }),
});

export const env = (() => {
  try {
    return schema.parse(process.env);
  } catch (e) {
    throw fromError(e);
  }
})();
