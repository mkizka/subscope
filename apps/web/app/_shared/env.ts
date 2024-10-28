import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // DATABASE_URL: z.string().url(),
  },
  client: {
    NEXT_PUBLIC_BSKY_HANDLE: z.string(),
    NEXT_PUBLIC_BSKY_PASSWORD: z.string(),
  },
  /*
   * Due to how Next.js bundles environment variables on Edge and Client,
   * we need to manually destructure them to make sure all are included in bundle.
   *
   * 💡 You'll get type errors if not all variables from `server` & `client` are included here.
   */
  experimental__runtimeEnv: {
    NEXT_PUBLIC_BSKY_HANDLE: process.env.NEXT_PUBLIC_BSKY_HANDLE,
    NEXT_PUBLIC_BSKY_PASSWORD: process.env.NEXT_PUBLIC_BSKY_PASSWORD,
  },
});
