import { createCookieSessionStorage } from "react-router";

import type { ICookieSessionStorage } from "@/app/server/application/interfaces/cookie-session-storage";
export const cookieSessionStorageFactory = ({
  cookieSecret,
  nodeEnv,
}: {
  cookieSecret: string;
  nodeEnv: string;
}): ICookieSessionStorage => {
  const storage = createCookieSessionStorage<{ did: string }>({
    cookie: {
      name: "subscope_session",
      secrets: [cookieSecret],
      httpOnly: true,
      secure: nodeEnv === "production",
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
