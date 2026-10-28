import { Client } from "@atproto/lex";
import type { OAuthSession } from "@atproto/oauth-client-node";
import { createCookieSessionStorage } from "react-router";

import { env } from "@/app/shared/env.js";

import { oauthClient } from "./client.server.js";

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
    name: "subscope_session",
    secrets: [env.COOKIE_SECRET],
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60,
    sameSite: "lax",
  },
});

export { commitSession, destroySession };

export const getSession = (request: Request) => {
  return _getSession(request.headers.get("Cookie"));
};

export const createAgent = (oauthSession: OAuthSession) => {
  return new Client(oauthSession, {
    service: `${env.APPVIEW_DID}#bsky_appview`,
  });
};

export async function getAgent(request: Request): Promise<Client | null> {
  const session = await getSession(request);
  if (!session.data.did) {
    return null;
  }
  try {
    const oauthSession = await oauthClient.restore(session.data.did);
    return createAgent(oauthSession);
  } catch {
    return null;
  }
}
