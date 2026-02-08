import { z } from "zod";
import { fromError } from "zod-validation-error";

export const isProduction =
  process.env.NODE_ENV === "production" && !process.env.E2E;

const match = <Prod, Default>({ prod, dev }: { prod: Prod; dev: Default }) => {
  return isProduction ? prod : dev;
};

const DEVELOPMENT_PRIVATE_KEY =
  "LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JR0hBZ0VBTUJNR0J5cUdTTTQ5QWdFR0NDcUdTTTQ5QXdFSEJHMHdhd0lCQVFRZ1hoS1ZMc2pwVSszSm9wd2kKcjhUcjBBVXVMNTNyRzR6V2duQkNSZUNRQjdTaFJBTkNBQVRaNzlHaGQxYnphVVpHb1lzcitLRVJxNnIyUXZJZApRQXZ4ZUpqRkdMbDJ0TDRmZUhSWmVkc3NxZjdDNUpjdGZWN2hKd2hYOG5ackxjYXU3OWtEQ25PTQotLS0tLUVORCBQUklWQVRFIEtFWS0tLS0tCg==";

const DEVELOPMENT_COOKIE_SECRET =
  "9k+IXwNgwmTlwte3xCOm+iy1qhUkKku7+wUpveFPe9y2";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error"])
    .default(match({ prod: "info", dev: "debug" })),
  REDIS_URL: match({
    prod: z.url(),
    dev: z.url().default("redis://localhost:6379"),
  }),
  PUBLIC_URL: match({
    prod: z.string(),
    dev: z.string().default("http://subscope.localhost:3000"),
  }),
  SERVICE_DID: match({
    prod: z.string(),
    dev: z.string().default("did:web:localhost%3A3000"),
  }),
  // openssl rand -base64 33
  COOKIE_SECRET: match({
    prod: z.string().min(32),
    dev: z.string().min(32).default(DEVELOPMENT_COOKIE_SECRET),
  }),
  // openssl ecparam -name prime256v1 -genkey | openssl pkcs8 -topk8 -nocrypt | openssl base64 -A
  PRIVATE_KEY_ES256_B64: match({
    prod: z.string(),
    dev: z.string().default(DEVELOPMENT_PRIVATE_KEY),
  }),
  ATPROTO_PLC_URL: match({
    prod: z.url().default("https://plc.directory"),
    dev: z.url().default("http://localhost:2582"),
  }),
  DATABASE_URL: match({
    prod: z.url(),
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
