import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { Request, Response } from "express";

import type { OAuthSession } from "../oauth/session.js";

export type Context = {
  oauthSession: OAuthSession;
  req: Request;
  res: Response;
};

export function createContextFactory(oauthSession: OAuthSession) {
  return ({ req, res }: CreateExpressContextOptions): Context => ({
    oauthSession,
    req,
    res,
  });
}
