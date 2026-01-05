import type { NextFunction, Request, RequestHandler, Response } from "express";

import type { OAuthSession } from "../../infrastructure/oauth/session";

export const authMiddlewareFactory = (
  oauthSession: OAuthSession,
): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const did = await oauthSession.getUserDid(req, res);
    if (!did) {
      res.redirect("/login");
      return;
    }
    next();
  };
};
authMiddlewareFactory.inject = ["oauthSession"] as const;
