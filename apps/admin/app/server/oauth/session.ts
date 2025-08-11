import { SubscoAgent } from "@repo/client/api";
import { createCookieSessionStorage } from "react-router"; // or cloudflare/deno

import { env } from "../env";
import { oauthClient } from "./client";

type SessionData = {
  did: string;
};

type SessionFlashData = {
  error: string;
};

const {
  getSession: _getSession,
  commitSession,
  destroySession,
} = createCookieSessionStorage<SessionData, SessionFlashData>({
  cookie: {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
    secrets: [env.COOKIE_SECRET],
  },
});

export { commitSession, destroySession };

export const getSession = (request: Request) => {
  return _getSession(request.headers.get("Cookie"));
};

export const getSessionUserDid = async (request: Request) => {
  const session = await getSession(request);
  if (!session.data.did) {
    return null;
  }
  return session.data.did;
};

export const getSessionAgent = async (request: Request) => {
  const session = await getSession(request);
  if (!session.data.did) {
    return null;
  }
  const oauthSession = await oauthClient.restore(session.data.did);
  return new SubscoAgent({
    oauthSession,
    atprotoProxy: env.ATPROTO_PROXY,
  });
};
