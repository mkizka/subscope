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
  PLC_URL: z
    .string()
    .url()
    .default(
      match({
        prod: "https://plc.directory",
        dev: "http://localhost:2582",
      }),
    ),
  JETSTREAM_URL: z
    .string()
    .url()
    .default(
      match({
        prod: "wss://jetstream1.us-west.bsky.network/subscribe",
        dev: "ws://localhost:6008/subscribe",
      }),
    ),
});

export const env = (() => {
  try {
    return schema.parse(process.env);
  } catch (e) {
    throw fromError(e);
  }
})();
