import type { NodeOAuthClient } from "@atproto/oauth-client-node";
import type { ILoggerManager } from "@repo/common/domain";
import { Router } from "express";

import type { OAuthSession } from "../../infrastructure/oauth/session";

export const oauthRouterFactory = (
  oauthClient: NodeOAuthClient,
  oauthSession: OAuthSession,
  loggerManager: ILoggerManager,
): Router => {
  const router = Router();
  const logger = loggerManager.createLogger("oauth");

  router.get("/client-metadata.json", (_req, res) => {
    res.json(oauthClient.clientMetadata);
  });

  router.get("/jwks.json", (_req, res) => {
    res.json(oauthClient.jwks);
  });

  router.post("/login", async (req, res) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const body = req.body as { identifier?: string } | undefined;
    const identifier = body?.identifier;
    if (!identifier) {
      res.status(400).json({ error: "identifier is required" });
      return;
    }

    try {
      const url = await oauthClient.authorize(identifier);
      res.redirect(url.toString());
    } catch (error) {
      logger.error(error, "OAuth認証に失敗しました");
      res.redirect("/login?error=auth_failed");
    }
  });

  router.get("/callback", async (req, res) => {
    try {
      const { session } = await oauthClient.callback(
        new URL(req.url, `http://${req.headers.host}`).searchParams,
      );
      await oauthSession.saveUserDid(req, res, session.did);
      res.redirect("/");
    } catch (error) {
      logger.error(error, "OAuthコールバックに失敗しました");
      res.redirect("/login?error=callback_failed");
    }
  });

  router.post("/logout", async (req, res) => {
    await oauthSession.destroySession(req, res);
    res.redirect("/");
  });

  return router;
};
oauthRouterFactory.inject = [
  "oauthClient",
  "oauthSession",
  "loggerManager",
] as const;
