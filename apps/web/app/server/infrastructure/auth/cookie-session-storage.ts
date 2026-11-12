import { createCookieSessionStorage } from "react-router";

import type { ICookieSessionStorage } from "@/app/server/application/interfaces/cookie-session-storage";
import type { Env } from "@/app/server/env";
export const cookieSessionStorageFactory = ({
  env,
}: {
  env: Pick<Env, "COOKIE_SECRET" | "NODE_ENV">;
}): ICookieSessionStorage => {
  const storage = createCookieSessionStorage<{ did: string }>({
    cookie: {
      name: "subscope_session",
      secrets: [env.COOKIE_SECRET],
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "lax",
    },
  });
  return {
    async getDid(cookieHeader) {
      const session = await storage.getSession(cookieHeader);
      return session.data.did ?? null;
    },
    async commit(cookieHeader, did) {
      const session = await storage.getSession(cookieHeader);
      session.set("did", did);
      return storage.commitSession(session);
    },
    async destroy(cookieHeader) {
      const session = await storage.getSession(cookieHeader);
      return storage.destroySession(session);
    },
  };
};
