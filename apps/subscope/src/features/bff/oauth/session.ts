import type { NodeOAuthClient } from "@atproto/oauth-client-node";
import { SubscoAgent } from "@repo/client/api";
import type { Request, Response } from "express";
import { getIronSession } from "iron-session";

import { env } from "../../../shared/env.js";

type SessionData = {
  did?: string;
};

const sessionOptions = {
  cookieName: "subscope_session",
  password: env.COOKIE_SECRET,
  cookieOptions: {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60,
  },
};

export class OAuthSession {
  constructor(private readonly oauthClient: NodeOAuthClient) {}
  static inject = ["oauthClient"] as const;

  private async getSession(req: Request, res: Response) {
    return getIronSession<SessionData>(req, res, sessionOptions);
  }

  async getUserDid(req: Request, res: Response): Promise<string | null> {
    const session = await this.getSession(req, res);
    return session.did ?? null;
  }

  async saveUserDid(req: Request, res: Response, did: string) {
    const session = await this.getSession(req, res);
    session.did = did;
    await session.save();
  }

  async destroySession(req: Request, res: Response) {
    const session = await this.getSession(req, res);
    session.destroy();
  }

  private async createAgent(did: string) {
    let oauthSession;
    try {
      oauthSession = await this.oauthClient.restore(did);
    } catch {
      return null;
    }
    return new SubscoAgent({
      oauthSession,
      atprotoProxy: env.ATPROTO_PROXY,
    });
  }

  async getAgent(req: Request, res: Response) {
    const did = await this.getUserDid(req, res);
    if (!did) {
      return null;
    }
    return this.createAgent(did);
  }
}
