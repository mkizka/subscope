import { createCookieSessionStorage } from "react-router";

import { env } from "@/app/server/env";

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

export interface ICookieSessionStorage {
  getDid: (cookieHeader: string | null) => Promise<string | null>;
  // 戻り値は Set-Cookie ヘッダーの値
  commit: (cookieHeader: string | null, did: string) => Promise<string>;
  destroy: (cookieHeader: string | null) => Promise<string>;
}

export const cookieSessionStorageFactory = (): ICookieSessionStorage => ({
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
});
