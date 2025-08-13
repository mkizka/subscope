import type { NextFunction, Request, RequestHandler, Response } from "express";

import type { OAuthSession } from "../oauth/session";

export const authMiddlewareFactory = (
  oauthSession: OAuthSession,
): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const did = await oauthSession.getExpressUserDid(req);
    if (!did) {
      res.redirect("/login");
      return;
    }
    next();
  };
};
authMiddlewareFactory.inject = ["oauthSession"] as const;
