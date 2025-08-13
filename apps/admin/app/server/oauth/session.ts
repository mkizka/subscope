import type { Did } from "@atproto/did";
import type { NodeOAuthClient } from "@atproto/oauth-client-node";
import { SubscoAgent } from "@repo/client/api";
import type { Request as ExpressRequest } from "express";
import { createCookieSessionStorage } from "react-router";

import { env } from "../env";

type SessionData = {
  did: Did;
};

type SessionFlashData = {
  error: string;
};

export class OAuthSession {
  readonly getSession;
  readonly commitSession;
  readonly destroySession;

  constructor(private readonly oauthClient: Promise<NodeOAuthClient>) {
    const sessionStorage = createCookieSessionStorage<
      SessionData,
      SessionFlashData
    >({
      cookie: {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60,
        secure: process.env.NODE_ENV === "production",
        secrets: [env.COOKIE_SECRET],
      },
    });
    this.getSession = sessionStorage.getSession;
    this.commitSession = sessionStorage.commitSession;
    this.destroySession = sessionStorage.destroySession;
  }
  static inject = ["oauthClient"] as const;

  async getUserDid(request: Request): Promise<string | null> {
    const session = await this.getSession(request.headers.get("Cookie"));
    return session.data.did ?? null;
  }

  async getExpressUserDid(request: ExpressRequest): Promise<string | null> {
    const session = await this.getSession(request.get("Cookie") ?? null);
    return session.data.did ?? null;
  }

  async getAgent(request: Request) {
    const did = await this.getUserDid(request);
    if (!did) {
      return null;
    }
    let oauthSession;
    try {
      const client = await this.oauthClient;
      oauthSession = await client.restore(did);
    } catch (e) {
      return null;
    }
    return new SubscoAgent({
      oauthSession,
      atprotoProxy: env.ATPROTO_PROXY,
    });
  }
}
