import type { ILoggerManager } from "@repo/common/domain";
import type { Request, Response } from "express";
import { Router } from "express";

import type { OAuthSession } from "../oauth/session";

const SUPPORTED_NSIDS = [
  "app.bsky.actor.getProfile",
  "me.subsco.admin.getInviteCodes",
  "me.subsco.admin.createInviteCode",
  "me.subsco.admin.getSubscribers",
];

export const xrpcProxyRouterFactory = (
  loggerManager: ILoggerManager,
  oauthSession: OAuthSession,
): Router => {
  const xrpcProxyRouter = Router();
  const logger = loggerManager.createLogger("xrpc-proxy");

  xrpcProxyRouter.use("/:nsid", async (req: Request, res: Response) => {
    const { nsid } = req.params;

    if (!nsid || !SUPPORTED_NSIDS.includes(nsid)) {
      return res.status(400).json({ error: "Invalid NSID" });
    }

    try {
      const agent = await oauthSession.getExpressAgent(req);

      if (!agent) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const body: unknown = req.method === "POST" ? req.body : undefined;
      const response = await agent.call(nsid, req.query, body);
      return res.json(response.data);
    } catch (error) {
      const message = `Failed to call ${nsid}`;
      logger.error(error, message);
      return res.status(500).json({ error: message });
    }
  });

  return xrpcProxyRouter;
};
xrpcProxyRouterFactory.inject = ["loggerManager", "oauthSession"] as const;
